# Recovered Files

This folder contains files that were quarantined during repository reorganization because they appeared to be duplicates or were loose files in the root directory with unclear purpose.

## /duplicates/

These files appear to be recovery duplicates (created during a file recovery process). The filenames contain timestamps like `13-18-28-XXX` which suggest they were created at 13:18:28 on various dates.

**Quarantined Files:**
- `page.tsx 13-18-28-*.tsx` (20 files) - Duplicate copies of page components
- `route.ts 13-18-28-*.ts` (40+ files) - Duplicate copies of API route handlers

If you need to recover code from these files, inspect them individually and merge any needed changes into the main codebase.

## /root_loose_files/

These files were found loose in the root directory and moved here because:
- `route.ts` - An API route file was in the root instead of `src/app/api/`
- `ngrok 2` - Unknown file, possibly an ngrok tunnel executable or log

## Recommended Action

After verifying the main application works correctly, you can safely delete this `_recovered/` folder if you no longer need these backup files.

```bash
# To delete after verification:
rm -rf _recovered/
```
