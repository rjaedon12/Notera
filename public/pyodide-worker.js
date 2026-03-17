/* ───────────────────────────────────────────────────────────────────────────
 *  Pyodide Web Worker — runs SymPy in a sandboxed WASM thread.
 *
 *  Message protocol
 *  ────────────────
 *  Main → Worker
 *    { type: "init" }                     — bootstrap Pyodide + SymPy
 *    { type: "execute", id, code, timeout } — run SymPy Python code
 *
 *  Worker → Main
 *    { type: "init-progress", stage }     — loading stage updates
 *    { type: "init-done" }               — ready
 *    { type: "init-error", error }       — fatal init failure
 *    { type: "result", id, latex, plain, rawLatex } — success
 *    { type: "error", id, error }        — execution error
 * ─────────────────────────────────────────────────────────────────────────── */

/* global importScripts, loadPyodide */

const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v0.27.5/full/";
const BLOCKED_MODULES = new Set([
  "os", "subprocess", "socket", "http", "urllib", "ftplib", "smtplib",
  "shutil", "signal", "ctypes", "multiprocessing", "threading",
  "importlib", "sys", "pathlib", "tempfile", "glob", "webbrowser",
]);
const MAX_INPUT_LENGTH = 4000;

let pyodide = null;

/* ── Initialisation ────────────────────────────────────────────────────── */

async function initPyodide() {
  try {
    postMessage({ type: "init-progress", stage: "Loading Pyodide runtime…" });
    importScripts(`${PYODIDE_CDN}pyodide.js`);

    postMessage({ type: "init-progress", stage: "Initialising WASM…" });
    pyodide = await loadPyodide({ indexURL: PYODIDE_CDN });

    postMessage({ type: "init-progress", stage: "Installing SymPy (one-time)…" });
    await pyodide.loadPackage("sympy");

    postMessage({ type: "init-progress", stage: "Configuring SymPy…" });
    await pyodide.runPythonAsync(`
import sympy
from sympy import *

# Convenience symbols pre-defined for the user
x, y, z, t, n, k, m, a, b, c = symbols('x y z t n k m a b c')

def _to_latex(expr):
    """Convert a SymPy expression to LaTeX string."""
    if isinstance(expr, (list, tuple)):
        return ', '.join(sympy.latex(e) for e in expr)
    if isinstance(expr, dict):
        parts = []
        for key, val in expr.items():
            parts.append(f"{sympy.latex(key)} = {sympy.latex(val)}")
        return ', '.join(parts)
    return sympy.latex(expr)

def _to_plain(expr):
    """Pretty-print as a string."""
    if isinstance(expr, (list, tuple)):
        return ', '.join(str(e) for e in expr)
    if isinstance(expr, dict):
        parts = []
        for key, val in expr.items():
            parts.append(f"{key} = {val}")
        return ', '.join(parts)
    return str(expr)
`);

    postMessage({ type: "init-done" });
  } catch (err) {
    postMessage({ type: "init-error", error: String(err) });
  }
}

/* ── Execution ─────────────────────────────────────────────────────────── */

async function executeCode(id, code) {
  if (!pyodide) {
    postMessage({ type: "error", id, error: "Pyodide not initialised yet." });
    return;
  }

  if (code.length > MAX_INPUT_LENGTH) {
    postMessage({
      type: "error", id,
      error: `Input too long (${code.length} chars). Maximum is ${MAX_INPUT_LENGTH}.`,
    });
    return;
  }

  // Block dangerous imports
  for (const mod of BLOCKED_MODULES) {
    const pattern = new RegExp(`(^|\\s|;)import\\s+${mod}($|\\s|;|,|\\.)|from\\s+${mod}($|\\s|;|\\.)`, "m");
    if (pattern.test(code)) {
      postMessage({
        type: "error", id,
        error: `Import of "${mod}" is not allowed in the CAS sandbox.`,
      });
      return;
    }
  }

  try {
    // Wrap user code: evaluate the last expression and capture output
    const wrappedCode = `
_cas_result = None
try:
    _cas_code = ${JSON.stringify(code)}
    # Try to eval as expression first
    try:
        _cas_result = eval(_cas_code)
    except SyntaxError:
        # Fall back to exec for statements
        _cas_ns = {}
        exec(_cas_code, globals(), _cas_ns)
        # Check if there's a variable named 'result'
        if 'result' in _cas_ns:
            _cas_result = _cas_ns['result']
        else:
            # Try to capture the last assigned variable
            for _k in reversed(list(_cas_ns.keys())):
                if not _k.startswith('_'):
                    _cas_result = _cas_ns[_k]
                    break
    
    if _cas_result is not None:
        _cas_latex = _to_latex(_cas_result)
        _cas_plain = _to_plain(_cas_result)
    else:
        _cas_latex = ""
        _cas_plain = "Done (no output)"
except Exception as _cas_e:
    _cas_latex = ""
    _cas_plain = f"Error: {_cas_e}"
    raise _cas_e

(_cas_latex, _cas_plain)
`;

    const result = await pyodide.runPythonAsync(wrappedCode);
    const [latex, plain] = result.toJs();

    postMessage({
      type: "result", id,
      latex: latex || "",
      plain: plain || "Done",
    });
  } catch (err) {
    const errStr = String(err);
    // Extract the actual Python error message
    const match = errStr.match(/PythonError:\s*(.*)/s);
    const cleanError = match ? match[1].trim().split("\n").pop() : errStr;
    postMessage({ type: "error", id, error: cleanError || errStr });
  }
}

/* ── Message handler ───────────────────────────────────────────────────── */

onmessage = async function (e) {
  const { type, id, code } = e.data;

  switch (type) {
    case "init":
      await initPyodide();
      break;
    case "execute":
      await executeCode(id, code);
      break;
    default:
      postMessage({ type: "error", id, error: `Unknown message type: ${type}` });
  }
};
