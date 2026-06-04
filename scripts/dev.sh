#!/bin/bash
# FlowState Dev Script
# Starts backend (Axum :3100) and frontend (Dioxus :8080) in parallel

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

cleanup() {
    echo -e "\n${RED}Stopping servers...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}Done!${NC}"
}

trap cleanup EXIT INT TERM

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  FlowState Dev Environment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Load .env if exists
if [ -f "$PROJECT_DIR/.env" ]; then
    echo -e "${GREEN}Loading .env...${NC}"
    export $(cat "$PROJECT_DIR/.env" | grep -v '^#' | xargs)
fi

# Start backend
echo -e "${BLUE}Starting backend on :3100...${NC}"
cd "$PROJECT_DIR"
cargo run -p backend &
BACKEND_PID=$!

# Wait for backend to be ready
echo -e "${BLUE}Waiting for backend...${NC}"
for i in $(seq 1 30); do
    if curl -s http://localhost:3100/health > /dev/null 2>&1; then
        echo -e "${GREEN}Backend ready!${NC}"
        break
    fi
    sleep 1
done

# Start frontend
echo -e "${BLUE}Starting frontend on :8080...${NC}"
cd "$PROJECT_DIR/crates/ui"
dx serve &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  FlowState is running!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "  Backend:  ${BLUE}http://localhost:3100${NC}"
echo -e "  Frontend: ${BLUE}http://localhost:8080${NC}"
echo ""
echo -e "  Press ${RED}Ctrl+C${NC} to stop all servers"
echo ""

# Wait for both processes
wait
