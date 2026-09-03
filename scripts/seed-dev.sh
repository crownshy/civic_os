#!/usr/bin/env bash
# Seed local development database with conversation, workflow, polis step + invite.
#
# Prereqs (in the comhairle repo — see comhairle's QUICKSTART.md):
#   just pg       # postgres on :5434
#   just api-dev  # axum on :3000
#   just seed     # creates default admin: admin@crown-shy.com / adminPassword123!
#
# This script logs in as that admin and creates a conversation/workflow/polis/invite,
# then points both packages' .env files at it (packages/admin/.env and
# packages/civicos/.env). The Campaign carries its own poll and invite on
# `metadata.poll`, so nothing else needs configuring.
#
# Usage (run from the repo root):
#   ./scripts/seed-dev.sh
#
# Env overrides:
#   API_URL         — backend base URL (default http://localhost:3000)
#   ADMIN_EMAIL     — admin user email (default admin@crown-shy.com)
#   ADMIN_PASSWORD  — admin password (default adminPassword123!)
#   ENV_FILES       — space-separated list of .env files to write
#                     (default: packages/admin/.env packages/civicos/.env)

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
# Slug has a uniqueness constraint backend-side, so suffix with a timestamp so
# the script is re-runnable without wiping the db first. Override with
# SEED_SLUG=my-slug to pin it.
SEED_TS="$(date +%s)"
SEED_SLUG="${SEED_SLUG:-local-dev-$SEED_TS}"

# The Place this Campaign runs in. The public URL is heading for
# <place>.bloomproject.us/<slug>, so the place slug is the subdomain you visit.
SEED_PLACE_SLUG="${SEED_PLACE_SLUG:-dundee}"
SEED_PLACE_NAME="${SEED_PLACE_NAME:-Dundee, Scotland}"

SEED_TITLE="${SEED_TITLE:-AI and the Future of $SEED_PLACE_NAME}"
SEED_QUESTION="${SEED_QUESTION:-How can $SEED_PLACE_NAME ensure the benefits of AI are widely shared and its risks are responsibly managed?}"

info "Step 2: Creating conversation (slug: $SEED_SLUG)..."
CONV_RESPONSE=$(curl -s -X POST "$BACKEND_URL/conversation" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d "$(jq -nc \
    --arg title "$SEED_TITLE" \
    --arg slug "$SEED_SLUG" \
    --arg place "$SEED_PLACE_NAME" \
    '{
      title: $title,
      short_description: ("A conversation for " + $place),
      description: ("People across " + $place + " are weighing in on how AI is changing their city, and what should be done about it. This is a local development seed: everything you submit is stored in your own Postgres."),
      image_url: "https://fakeimg.pl/1000x600",
      tags: ["dev", "local", "testing"],
      is_public: true,
      is_live: false,
      is_invite_only: false,
      slug: $slug,
      primary_locale: "en",
      supported_languages: ["en"]
    }')")

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

# --- Place -------------------------------------------------------------------
# Comhairle has a Region model but nothing links a Conversation to one, Regions
# have no slug, and /regions is authenticated while the participant app resolves
# the subdomain anonymously. So the Place rides on metadata for now, which is
# public on GET /conversation/:slug. See packages/civicos/src/lib/config/place.ts.
info "Step 2.5: Setting place ($SEED_PLACE_NAME)..."
PLACE_STATUS=$(curl -s -o /dev/null -w '%{http_code}' -X PATCH \
  "$BACKEND_URL/conversation/$CONVERSATION_ID/metadata" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d "$(jq -nc --arg s "$SEED_PLACE_SLUG" --arg n "$SEED_PLACE_NAME" \
    '{place: {slug: $s, name: $n}}')")

if echo "$PLACE_STATUS" | grep -qE '^2[0-9][0-9]$'; then
  ok "place: $SEED_PLACE_SLUG ($SEED_PLACE_NAME)"
else
  info "  ! setting place failed (HTTP $PLACE_STATUS) — civicos will fall back to regions.ts"
fi

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
  -d "$(jq -nc --arg topic "$SEED_QUESTION" '{
    name: "Polis Step",
    step_order: 1,
    activation_rule: "manual",
    description: "Polis deliberation step",
    required: false,
    is_offline: false,
    tool_setup: { type: "polis", topic: $topic }
  }')")

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
  "(dev) $SEED_PLACE_NAME should train its own workforce rather than import expertise"
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

# --- Poll identity -----------------------------------------------------------
# The participant app resolves anonymously, and the Polis workflow step is 401
# to an anonymous caller: GET /conversation/:id/workflow is public but
# .../workflow_step is not. So the poll id, server and question are mirrored
# onto the Conversation metadata, which IS public on GET /conversation/:slug.
# Without this, civicos falls back to the checked-in regions.ts map keyed by zip
# and serves whichever poll that guesses. Admin writes the same object when a
# Host publishes a Campaign to a Place. See packages/shared/src/data/place.ts.
info "Step 5.5: Mirroring poll identity into metadata..."
POLL_STATUS=$(curl -s -o /dev/null -w '%{http_code}' -X PATCH \
  "$BACKEND_URL/conversation/$CONVERSATION_ID/metadata" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d "$(jq -nc --arg p "$POLIS_ID" --arg u "$POLIS_URL" --arg i "$INVITE_ID" --arg q "$SEED_QUESTION" \
    '{poll: {polisId: $p, polisUrl: $u, inviteId: $i, question: $q}}')")

if echo "$POLL_STATUS" | grep -qE '^2[0-9][0-9]$'; then
  ok "poll: $POLIS_ID"
else
  info "  ! mirroring poll failed (HTTP $POLL_STATUS) — civicos will fall back to regions.ts"
fi

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

# --- Aux sync ----------------------------------------------------------------
# Pull the just-seeded polis statements into the comhairle aux table so the
# admin moderation tab has rows to work with on first open. Without this, the
# aux table starts empty after every re-seed even though polis has statements.
# Endpoint is from comhairle PR #467 — skipped (with a warning) on older
# backends that don't have it.
info "Step 7: Syncing polis statements into aux table..."
SYNC_RESPONSE=$(curl -s -w '\n%{http_code}' -X POST \
  "$BACKEND_URL/tools/polis/statement_aux/sync" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d "$(jq -nc --arg w "$WORKFLOW_STEP_ID" '{workflow_step_id:$w}')")
SYNC_STATUS=$(printf '%s' "$SYNC_RESPONSE" | tail -n1)
SYNC_BODY=$(printf '%s' "$SYNC_RESPONSE" | sed '$d')

if echo "$SYNC_STATUS" | grep -qE '^2[0-9][0-9]$'; then
  SYNC_COUNT=$(echo "$SYNC_BODY" | jq -r '.synced // 0')
  ok "synced $SYNC_COUNT statements into aux"

  # Workflow-step creation returns `previewToolConfig.poll_id`, which is a
  # *preview* polis id and NOT the conversation the backend actually wires the
  # workflow_step to. Sync's response is ground truth — each row carries the
  # real polis_conversation_id. Override $POLIS_ID with it so the public app's
  # embed targets the same polis conversation admin moderation watches.
  REAL_POLIS_ID=$(echo "$SYNC_BODY" | jq -r '.statements[0].polis_conversation_id // empty')
  if [ -n "$REAL_POLIS_ID" ] && [ "$REAL_POLIS_ID" != "$POLIS_ID" ]; then
    info "  ! workflow_step's real polis_conversation_id is $REAL_POLIS_ID (preview id $POLIS_ID was wrong) — using real one for env"
    POLIS_ID="$REAL_POLIS_ID"
  fi
elif [ "$SYNC_STATUS" = "404" ]; then
  info "  ! aux sync endpoint not found — backend may predate comhairle PR #467, skipping"
  info "  ! WARN: the seeded poll id will be the workflow_step's previewToolConfig.poll_id, which is likely NOT the real conversation. Public-app submissions won't appear in admin moderation."
else
  info "  ! aux sync failed (HTTP $SYNC_STATUS): $SYNC_BODY"
fi

# --- Org scoping fixture -----------------------------------------------------
# Everything above gives you one conversation owned by nobody, which is enough to
# develop against but useless for testing per-org visibility (#397): with a single
# unowned conversation, "filtered correctly" and "not filtered at all" look the same.
#
# This step builds the smallest fixture that can tell them apart:
#   - a Host org that owns the seeded conversation
#   - a member user in that org, with a password you can actually log in with
#   - a second org owning a second conversation, which the member must NOT see
#
# Every call here is non-fatal. If your backend predates any of it you still get a
# working dev seed, just without the fixture. Skip entirely with SEED_SCOPING=0.
SEED_SCOPING="${SEED_SCOPING:-1}"

if [ "$SEED_SCOPING" = "1" ]; then
  MEMBER_EMAIL="${SEED_MEMBER_EMAIL:-host-member@example.com}"
  MEMBER_PASSWORD="${SEED_MEMBER_PASSWORD:-memberPassword123!}"

  create_org() {
    curl -s -X POST "$BACKEND_URL/organizations" \
      -H "Content-Type: application/json" \
      -H "$AUTH_HEADER" \
      -d "$(jq -nc --arg n "$1" '{
        name: $n,
        description: "Seeded by scripts/seed-dev.sh",
        mission: "Local development fixture",
        org_type: "non_profit"
      }')" \
      | jq -r '.id // empty'
  }

  info "Step 8: Creating Host org and attaching the conversation..."
  ORG_ID=$(create_org "${SEED_ORG_NAME:-Local Dev Host ($SEED_TS)}")

  if [ -z "$ORG_ID" ]; then
    info "  ! org creation failed — skipping the scoping fixture"
  else
    ok "host org: $ORG_ID"

    # CreateConversation silently drops organization_id, so ownership has to be set
    # in a follow-up PUT. The field is also missing from PartialConversation in the
    # generated client, but the schema is passthrough and the backend honours it.
    OWN_STATUS=$(curl -s -o /dev/null -w '%{http_code}' -X PUT \
      "$BACKEND_URL/conversation/$CONVERSATION_ID" \
      -H "Content-Type: application/json" \
      -H "$AUTH_HEADER" \
      -d "$(jq -nc --arg o "$ORG_ID" '{organization_id:$o}')")
    if echo "$OWN_STATUS" | grep -qE '^2[0-9][0-9]$'; then
      ok "conversation owned by $ORG_ID"
    else
      info "  ! setting organization_id failed (HTTP $OWN_STATUS) — conversation stays unowned"
    fi

    # Member with a real password. AddOrganizationMember can bootstrap an account,
    # but a bootstrapped user has no password, so sign up first and add second.
    info "Step 8.1: Creating member $MEMBER_EMAIL..."
    SIGNUP_STATUS=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BACKEND_URL/auth/signup" \
      -H "Content-Type: application/json" \
      --data "$(jq -nc \
        --arg e "$MEMBER_EMAIL" \
        --arg p "$MEMBER_PASSWORD" \
        --arg u "${MEMBER_EMAIL%@*}" \
        '{email:$e,password:$p,username:$u}')")
    if echo "$SIGNUP_STATUS" | grep -qE '^2[0-9][0-9]$'; then
      ok "signed up $MEMBER_EMAIL"
    else
      info "  ! signup returned HTTP $SIGNUP_STATUS — assuming the user already exists"
      info "    (if the password differs, override with SEED_MEMBER_PASSWORD)"
    fi

    MEMBER_STATUS=$(curl -s -o /dev/null -w '%{http_code}' -X POST \
      "$BACKEND_URL/organizations/$ORG_ID/members" \
      -H "Content-Type: application/json" \
      -H "$AUTH_HEADER" \
      -d "$(jq -nc --arg e "$MEMBER_EMAIL" '{email:$e, role:"member", allow_create_user:true}')")
    if echo "$MEMBER_STATUS" | grep -qE '^2[0-9][0-9]$'; then
      ok "$MEMBER_EMAIL is a member of $ORG_ID"
    else
      info "  ! adding member failed (HTTP $MEMBER_STATUS)"
    fi

    # The negative case. A bare conversation, no workflow or polis, existing only so
    # there is something on the dashboard the member has no claim to.
    info "Step 8.2: Creating a second org + conversation the member should not see..."
    OTHER_ORG_ID=$(create_org "${SEED_OTHER_ORG_NAME:-Other Local Host ($SEED_TS)}")
    OTHER_CONV_ID=$(curl -s -X POST "$BACKEND_URL/conversation" \
      -H "Content-Type: application/json" \
      -H "$AUTH_HEADER" \
      -d "$(jq -nc --arg s "other-local-dev-$SEED_TS" '{
        title: "Other Host'"'"'s Conversation",
        short_description: "Belongs to a different org",
        description: "Seeded so per-org visibility has a negative case to fail against.",
        image_url: "https://fakeimg.pl/1000x600",
        tags: ["dev", "local", "negative-case"],
        is_public: true,
        is_live: false,
        is_invite_only: false,
        slug: $s,
        primary_locale: "en",
        supported_languages: ["en"]
      }')" | jq -r '.id // empty')

    if [ -n "$OTHER_ORG_ID" ] && [ -n "$OTHER_CONV_ID" ]; then
      curl -s -o /dev/null -X PUT "$BACKEND_URL/conversation/$OTHER_CONV_ID" \
        -H "Content-Type: application/json" \
        -H "$AUTH_HEADER" \
        -d "$(jq -nc --arg o "$OTHER_ORG_ID" '{organization_id:$o}')"
      ok "other org: $OTHER_ORG_ID"
      ok "other conversation: $OTHER_CONV_ID"
    else
      info "  ! second org/conversation failed — no negative case seeded"
    fi

    echo ""
    info "Host org fixture:"
    echo "    org:            $ORG_ID"
    echo "    member login:   $MEMBER_EMAIL / $MEMBER_PASSWORD"
    echo "    should see:     $CONVERSATION_ID"
    echo "    should not see: ${OTHER_CONV_ID:-<not created>}"
    echo ""
    echo "  ⚠️  On the backend build this was written against, that member cannot"
    echo "     reach the admin app at all: /regions, /user/organizations and"
    echo "     /user/permitted_conversations all return 401 'Requires Auth User'"
    echo "     for a non-admin, whether their org role is member or admin. The"
    echo "     admin app's hooks.server.ts probes /regions, so the login bounces"
    echo "     to /login?denied=1. See #397."
  fi
fi

# --- Done --------------------------------------------------------------------
echo ""
printf "${GREEN}═══════════════════════════════════════════════════════════════${NC}\n"
printf "${GREEN}✅ Seeding complete!${NC}\n"
printf "${GREEN}═══════════════════════════════════════════════════════════════${NC}\n"
echo ""
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# One .env per package. Override with ENV_FILES="path1 path2" to pin them.
DEFAULT_ENV_FILES="$REPO_ROOT/packages/admin/.env $REPO_ROOT/packages/civicos/.env"
ENV_FILES="${ENV_FILES:-$DEFAULT_ENV_FILES}"

ENV_BLOCK=$(cat <<EOF
# --- Generated by scripts/seed-dev.sh ---
# Which Campaign the Place root redirects to. Participant URLs carry the slug
# on the path (<place>.host/<campaign-slug>); this is only for bare \`/\`.
PUBLIC_CAMPAIGN_SLUG=$SEED_SLUG
EOF
)

# Admin builds every Campaign's participant link from this apex, so an .env
# without it renders "No participant site yet" on every Campaign at once, and
# only the ones with a hardcoded regions.ts shareUrl look like they work. Older
# .env files predate the var, so top it up rather than assume .env.example.
ensure_participant_base() {
  env_file="$1"
  case "$env_file" in
    */admin/.env) ;;
    *) return 0 ;;
  esac
  grep -q '^PUBLIC_PARTICIPANT_BASE_URL=' "$env_file" 2>/dev/null && return 0

  printf '\n# Apex the participant app is served from, without a scheme.\nPUBLIC_PARTICIPANT_BASE_URL=localhost:5173\n' >> "$env_file"
  ok "added PUBLIC_PARTICIPANT_BASE_URL to $env_file"
}

write_env() {
  env_file="$1"
  # Strip the previous generated block, including the retired PUBLIC_DEV_* vars
  # an older run of this script may have left behind, then append a fresh one.
  if [ -f "$env_file" ]; then
    grep -v -e '^PUBLIC_DEV_' -e '^PUBLIC_CAMPAIGN_SLUG' -e '^# --- Local dev region (generated' -e '^# --- Generated by scripts/seed-dev.sh' -e '^# Which Campaign the Place root' -e '^# on the path' "$env_file" > "$env_file.tmp" && mv "$env_file.tmp" "$env_file"
  fi
  ensure_participant_base "$env_file"
  printf '\n%s\n' "$ENV_BLOCK" >> "$env_file"
  ok "wrote $env_file"
}

echo "Add these to your .env files ($ENV_FILES):"
echo ""
echo "$ENV_BLOCK"
echo ""

# Offer to write them automatically.
if [ -t 0 ]; then
  read -r -p "Write these to the .env files now? [Y/n] " ans
  ans="${ans:-Y}"
  case "$ans" in
    [Yy]*)
      for env_file in $ENV_FILES; do
        write_env "$env_file"
      done
      ;;
  esac
fi

echo ""
echo "Then: pnpm dev → http://$SEED_PLACE_SLUG.localhost:5173/$SEED_SLUG"
echo ""
