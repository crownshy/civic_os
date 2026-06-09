#!/usr/bin/env bash
# Seed local development database with conversation, workflow, polis step + invite.
#
# Prereqs (in the comhairle repo — see comhairle's QUICKSTART.md):
#   just pg       # postgres on :5434
#   just api-dev  # axum on :3000
#   just seed     # creates default admin: admin@crown-shy.com / adminPassword123!
#
# This script logs in as that admin and creates a conversation/workflow/polis/invite.
#
# Usage:
#   ./scripts/seed-dev.sh
#
# Env overrides:
#   API_URL         — backend base URL (default http://localhost:3000)
#   ADMIN_EMAIL     — admin user email (default admin@crown-shy.com)
#   ADMIN_PASSWORD  — admin password (default adminPassword123!)

set -euo pipefail

BACKEND_URL="${API_URL:-http://localhost:3000}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@crown-shy.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-adminPassword123!}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { printf "${YELLOW}%s${NC}\n" "$*"; }
ok()    { printf "${GREEN}✅ %s${NC}\n" "$*"; }
fail()  { printf "${RED}❌ %s${NC}\n" "$*" >&2; }

require() {
  command -v "$1" >/dev/null 2>&1 || { fail "missing dep: $1"; exit 1; }
}
require curl
require jq

echo "🌱 Seeding local development database..."
echo "Backend URL: $BACKEND_URL"
echo "Admin email: $ADMIN_EMAIL"
echo ""

# --- Sanity check: backend reachable -----------------------------------------
if ! curl -s -o /dev/null -w '%{http_code}' "$BACKEND_URL/" | grep -qE '^[2-4][0-9][0-9]$'; then
  fail "backend not reachable at $BACKEND_URL — did you run 'just api-dev' in the comhairle repo?"
  exit 1
fi

# --- Login (or signup if user doesn't exist) ---------------------------------
# Tries to log in first. If login fails, attempts to create the user via
# /auth/signup. Note: the new user is only an admin if their email is listed in
# the backend's ADMIN_USERS env var (see comhairle's .env).
extract_cookie() {
  printf '%s' "$1" \
    | tr -d '\r' \
    | awk -F'auth-token=' 'tolower($0) ~ /^set-cookie:/ && NF>1 { sub(/;.*/, "", $2); print $2; exit }'
}

info "Step 1: Logging in as $ADMIN_EMAIL..."
LOGIN_RESPONSE=$(curl -s -i -X POST "$BACKEND_URL/auth/login" \
  -H "Content-Type: application/json" \
  --data "$(jq -nc --arg e "$ADMIN_EMAIL" --arg p "$ADMIN_PASSWORD" '{email:$e,password:$p}')" \
  || true)

AUTH_COOKIE=$(extract_cookie "$LOGIN_RESPONSE")

if [ -z "$AUTH_COOKIE" ]; then
  info "  login failed — attempting to sign up $ADMIN_EMAIL..."
  ADMIN_USERNAME="${ADMIN_USERNAME:-${ADMIN_EMAIL%@*}}"
  SIGNUP_RESPONSE=$(curl -s -i -X POST "$BACKEND_URL/auth/signup" \
    -H "Content-Type: application/json" \
    --data "$(jq -nc \
      --arg e "$ADMIN_EMAIL" \
      --arg p "$ADMIN_PASSWORD" \
      --arg u "$ADMIN_USERNAME" \
      '{email:$e,password:$p,username:$u}')" \
    || true)

  AUTH_COOKIE=$(extract_cookie "$SIGNUP_RESPONSE")

  if [ -z "$AUTH_COOKIE" ]; then
    fail "signup failed for $ADMIN_EMAIL"
    echo ""
    echo "  Response:"
    printf '%s\n' "$SIGNUP_RESPONSE" | sed 's/^/    /'
    echo ""
    echo "  If a user with this email already exists with a different password,"
    echo "  override credentials:"
    echo "    ADMIN_EMAIL='you@example.com' ADMIN_PASSWORD='...' ./scripts/seed-dev.sh"
    exit 1
  fi
  ok "signed up new user $ADMIN_EMAIL"
  echo ""
  echo "  ⚠️  This user is only an admin if $ADMIN_EMAIL is in ADMIN_USERS in"
  echo "     comhairle's .env. If conversation creation fails next, add the email"
  echo "     to ADMIN_USERS and restart 'just api-dev'."
else
  ok "logged in"
fi

AUTH_HEADER="Cookie: auth-token=$AUTH_COOKIE"

# --- Conversation ------------------------------------------------------------
info "Step 2: Creating conversation..."
CONV_RESPONSE=$(curl -s -X POST "$BACKEND_URL/conversation" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{
    "title": "Local Dev Conversation",
    "short_description": "A conversation for local development",
    "description": "Local development conversation for testing Civic OS features. All data is stored in your local Postgres database.",
    "image_url": "https://fakeimg.pl/1000x600",
    "tags": ["dev", "local", "testing"],
    "is_public": true,
    "is_live": false,
    "is_invite_only": false,
    "slug": "local-dev",
    "primary_locale": "en",
    "supported_languages": ["en"]
  }')

CONVERSATION_ID=$(echo "$CONV_RESPONSE" | jq -r '.id // empty')
if [ -z "$CONVERSATION_ID" ]; then
  fail "conversation creation failed: $CONV_RESPONSE"
  echo ""
  echo "  Hint: this usually means $ADMIN_EMAIL isn't an admin on the backend."
  echo "  Run 'just seed' in the comhairle repo to create the default admin,"
  echo "  or add $ADMIN_EMAIL to ADMIN_USERS in comhairle's .env and restart 'just api-dev'."
  exit 1
fi
ok "conversation: $CONVERSATION_ID"

# --- Workflow ----------------------------------------------------------------
info "Step 3: Creating workflow..."
WORKFLOW_RESPONSE=$(curl -s -X POST "$BACKEND_URL/conversation/$CONVERSATION_ID/workflow" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{
    "name": "Dev Workflow",
    "description": "Local development workflow",
    "is_active": true,
    "is_public": true,
    "auto_login": false
  }')

WORKFLOW_ID=$(echo "$WORKFLOW_RESPONSE" | jq -r '.id // empty')
if [ -z "$WORKFLOW_ID" ]; then
  fail "workflow creation failed: $WORKFLOW_RESPONSE"
  exit 1
fi
ok "workflow: $WORKFLOW_ID"

# --- Polis workflow step (this is what creates the Polis poll for us) --------
# The backend hits its configured polis_url (default polis.comhairle.scot) and
# creates a poll on our behalf. The poll_id comes back in previewToolConfig.
info "Step 4: Creating Polis workflow step (this creates the Polis poll for you)..."
WORKFLOW_STEP_RESPONSE=$(curl -s -X POST \
  "$BACKEND_URL/conversation/$CONVERSATION_ID/workflow/$WORKFLOW_ID/workflow_step" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{
    "name": "Polis Step",
    "step_order": 1,
    "activation_rule": "manual",
    "description": "Polis deliberation step",
    "required": false,
    "is_offline": false,
    "tool_setup": {
      "type": "polis",
      "topic": "How can developers ensure the benefits of AI are widely shared and risks are responsibly managed?"
    }
  }')

WORKFLOW_STEP_ID=$(echo "$WORKFLOW_STEP_RESPONSE" | jq -r '.id // empty')
POLIS_ID=$(echo "$WORKFLOW_STEP_RESPONSE" | jq -r '.previewToolConfig.poll_id // empty')

if [ -z "$WORKFLOW_STEP_ID" ]; then
  fail "workflow step creation failed: $WORKFLOW_STEP_RESPONSE"
  exit 1
fi
if [ -z "$POLIS_ID" ]; then
  fail "couldn't extract Polis poll_id. Response was: $WORKFLOW_STEP_RESPONSE"
  exit 1
fi
ok "workflow step: $WORKFLOW_STEP_ID"
ok "polis poll:    $POLIS_ID"

# --- Polis seed statements ---------------------------------------------------
# Posts as anonymous participant (xid). Not "true" seed statements — those
# require owner cookie which script doesn't have. Good enough for dev.
POLIS_URL="${POLIS_URL:-https://polis.comhairle.scot}"
SEED_XID="seed-dev-$(date +%s)"

SEED_STATEMENTS=(
  "(dev) AI should be open source and auditable"
  "(dev) Risk-based regulation works better than blanket bans"
  "(dev) Compute access is the real bottleneck for fair AI"
  "(dev) Training data provenance must be disclosed"
  "(dev) Small models deployed locally beat large remote ones for privacy"
)

info "Step 4.5: Seeding Polis statements ($POLIS_URL)..."
for stmt in "${SEED_STATEMENTS[@]}"; do
  RESP=$(curl -s -X POST "$POLIS_URL/api/v3/comments" \
    -H "Content-Type: application/json" \
    --data "$(jq -nc \
      --arg t "$stmt" \
      --arg c "$POLIS_ID" \
      --arg x "$SEED_XID" \
      '{txt:$t, conversation_id:$c, xid:$x, agid:1, vote:-1, is_seed:false}')" \
    || true)
  if echo "$RESP" | jq -e '.tid // .currentPid' >/dev/null 2>&1; then
    ok "  + $stmt"
  else
    info "  ! failed: $stmt — $RESP"
  fi
done

# --- Open invite -------------------------------------------------------------
info "Step 5: Creating open invite..."
INVITE_RESPONSE=$(curl -s -X POST "$BACKEND_URL/conversation/$CONVERSATION_ID/invite" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d "$(jq -nc --arg w "$WORKFLOW_ID" '{invite_type:"open", workflow_id:$w}')")

INVITE_ID=$(echo "$INVITE_RESPONSE" | jq -r '.id // empty')
if [ -z "$INVITE_ID" ]; then
  fail "invite creation failed: $INVITE_RESPONSE"
  exit 1
fi
ok "invite: $INVITE_ID"

# --- Launch (make conversation live) -----------------------------------------
# Invites only work against live conversations.
info "Step 6: Launching conversation (making it live)..."
LAUNCH_RESPONSE=$(curl -s -w '\n%{http_code}' -X PUT \
  "$BACKEND_URL/conversation/$CONVERSATION_ID/launch" \
  -H "$AUTH_HEADER")
LAUNCH_STATUS=$(printf '%s' "$LAUNCH_RESPONSE" | tail -n1)
LAUNCH_BODY=$(printf '%s' "$LAUNCH_RESPONSE" | sed '$d')

if ! echo "$LAUNCH_STATUS" | grep -qE '^2[0-9][0-9]$'; then
  fail "launch failed (HTTP $LAUNCH_STATUS): $LAUNCH_BODY"
  exit 1
fi
ok "conversation is live"

# --- Done --------------------------------------------------------------------
echo ""
printf "${GREEN}═══════════════════════════════════════════════════════════════${NC}\n"
printf "${GREEN}✅ Seeding complete!${NC}\n"
printf "${GREEN}═══════════════════════════════════════════════════════════════${NC}\n"
echo ""
ENV_FILE_DEFAULT="$(cd "$(dirname "$0")/.." && pwd)/.env"
ENV_FILE="${ENV_FILE:-$ENV_FILE_DEFAULT}"

ENV_BLOCK=$(cat <<EOF
# --- Local dev region (generated by scripts/seed-dev.sh) ---
PUBLIC_DEV_CONVERSATION_ID=$CONVERSATION_ID
PUBLIC_DEV_INVITE_ID=$INVITE_ID
PUBLIC_DEV_POLIS_ID=$POLIS_ID
PUBLIC_DEV_POLIS_WORKFLOW_STEP_ID=$WORKFLOW_STEP_ID
EOF
)

echo "Add these to your $ENV_FILE:"
echo ""
echo "$ENV_BLOCK"
echo ""

# Offer to write them automatically.
if [ -t 0 ]; then
  read -r -p "Write these to $ENV_FILE now? [Y/n] " ans
  ans="${ans:-Y}"
  case "$ans" in
    [Yy]*)
      # Strip any prior PUBLIC_DEV_* lines, then append fresh block.
      if [ -f "$ENV_FILE" ]; then
        grep -v '^PUBLIC_DEV_' "$ENV_FILE" > "$ENV_FILE.tmp" && mv "$ENV_FILE.tmp" "$ENV_FILE"
      fi
      printf '\n%s\n' "$ENV_BLOCK" >> "$ENV_FILE"
      ok "wrote $ENV_FILE"
      ;;
  esac
fi

echo ""
echo "Then: pnpm dev → http://dev.localhost:5173"
echo ""
