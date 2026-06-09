#!/usr/bin/env bash
# make-admin-hash.sh
# Generates a bcrypt hash for the ADMIN_PASSWORD_HASH env var.
# Your password is hashed locally and NEVER sent over the network.
# Usage:  ./scripts/make-admin-hash.sh

set -e

# Run from project root so node_modules is found
cd "$(dirname "$0")/.."

if [ ! -d node_modules/bcryptjs ]; then
  echo "bcryptjs not found in node_modules. Run 'npm install' first." >&2
  exit 1
fi

printf "new admin password: "
stty -echo
IFS= read -r PW
stty echo
printf "\n"

printf "confirm password:   "
stty -echo
IFS= read -r PW2
stty echo
printf "\n"

if [ -z "$PW" ]; then
  echo "No password entered." >&2
  exit 1
fi
if [ "$PW" != "$PW2" ]; then
  echo "Passwords don't match." >&2
  exit 1
fi
if [ ${#PW} -lt 8 ]; then
  echo "Password must be at least 8 characters." >&2
  exit 1
fi

# Generate hash via the project's bcryptjs (already a dep)
# Password passed via env var so it doesn't show in `ps`
HASH=$(PW="$PW" node -e '
import("bcryptjs").then(b => {
  process.stdout.write(b.default.hashSync(process.env.PW, 10));
}).catch(err => { console.error(err); process.exit(1); });
')

if [ -z "$HASH" ]; then
  echo "Hash generation failed." >&2
  exit 1
fi

cat <<EOF

Hash generated.

Next steps:

  1. Open Hostinger hPanel -> your Node app -> Environment Variables
  2. Set or update this variable (copy the FULL line, including the leading $):

       ADMIN_PASSWORD_HASH=$HASH

  3. Restart the Node app from hPanel (the new hash only takes effect on restart)
  4. Run ./scripts/pull-logs.sh and type the password you just entered

EOF
