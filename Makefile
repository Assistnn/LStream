# ------- 開発環境系
setup: setup-repo setup-app
setup-repo: ensure-nodenv
	pnpm install
setup-app:
	cd app && pnpm install --frozen-lockfile
	cd .docker/dev && docker compose build
	cd app/ios && pod install

lint: lint-root lint-app
lint-root:
	pnpm run lint
lint-app:
	cd .docker/dev && docker compose run --rm --no-deps app bash -c "cd /workspace/app && pnpm run lint"

fix: fix-root fix-app
fix-root:
	pnpm run fix
fix-app:
	cd .docker/dev && docker compose run --rm --no-deps app bash -c "cd /workspace/backend && pnpm run fix"

test:
	cd .docker/dev && docker compose run --rm app bash -c "cd /workspace/app && pnpm run test"

zsh-app:
	cd .docker/dev && docker compose run --rm app zsh

open:
	@echo "Building and opening backend in DevContainer..."
	@pnpm run devcontainer:up
	@CONFIG_JSON='{"settingType":"config","workspacePath":"$(PWD)","devcontainerPath":"$(PWD)/.docker/dev/devcontainer.json"}'; \
	HEX_CONFIG=$$(printf '%s' "$$CONFIG_JSON" | xxd -p | tr -d '\n'); \
	DEVCONTAINER_URI="vscode-remote://dev-container+$${HEX_CONFIG}/workspace/app"; \
	if command -v cursor >/dev/null 2>&1; then \
		echo "Opening DevContainer in Cursor IDE..."; \
		CURSOR_CLI_BLOCK_CURSOR_AGENT=true cursor --folder-uri "$$DEVCONTAINER_URI"; \
	else \
		echo "Cursor IDE not found. You can manually connect to DevContainer using VS Code or other IDE."; \
		echo "DevContainer URI: $$DEVCONTAINER_URI"; \
	fi
dev-ios: open
	@UDID=$$(xcrun simctl list devices booted -j | python3 -c "import sys,json; ds=json.load(sys.stdin)['devices']; print(next((u['udid'] for r in ds.values() for u in r if u['state']=='Booted'), ''))"); \
	if [ -z "$$UDID" ]; then \
		echo "No booted simulator found. Booting default iPhone..."; \
		UDID=$$(xcrun simctl list devices available -j | python3 -c "import sys,json; ds=json.load(sys.stdin)['devices']; print(next(u['udid'] for r in ds.values() for u in r if u['state']=='Shutdown' and 'iPhone' in u['name']))"); \
		xcrun simctl boot "$$UDID"; \
	fi; \
	open -a Simulator; \
	cd app && npx react-native run-ios --udid "$$UDID"
dev-android: open
	cd app && JAVA_HOME=/opt/homebrew/opt/openjdk@17 pnpm run android
logs:
	cd .docker/dev && docker compose logs -f

up:
	cd .docker/dev && docker compose up -d

stop:
	cd .docker/dev && docker compose stop

clean: clean-app clean-git
clean-app:
	cd .docker/dev && docker compose down --rmi local --remove-orphans
clean-all: clean-all-app clean-git
clean-all-app:
	cd .docker/dev && docker compose down --rmi local --remove-orphans --volumes
clean-git:
	git add .
	git clean -fdx

# ------- メンテナンス系
install:
	cd .docker/dev && docker compose run --no-deps --rm app bash -c \
	"cd /workspace/app && pnpm store prune && rm -rf pnpm-lock.yaml && pnpm install && pnpm approve-builds"

update-packages: update-packages-app lint stop update-packages-push
update-packages-app:
	cd .docker/dev && docker compose run --rm app bash -c \
	"cd /workspace/app && ncu -ws -u && pnpm store prune && rm -rf pnpm-lock.yaml && pnpm install && pnpm approve-builds"
update-packages-push:
	git add .
	git commit -m "chore: update packages"
	git push origin
# ------- util
ensure-nodenv:
	@if ! command -v nodenv >/dev/null 2>&1; then \
		echo "nodenv is not installed. Installing nodenv..."; \
		brew install nodenv; \
		echo 'export PATH="$$HOME/.nodenv/bin:$$PATH"' >> ~/.zshrc; \
		echo 'eval "$$(nodenv init -)"' >> ~/.zshrc; \
		export PATH="$$HOME/.nodenv/bin:$$PATH"; \
		eval "$$(nodenv init -)"; \
	fi
	@NODE_VERSION=$$(cat .node-version | tr -d '\n'); \
	if ! nodenv versions | grep -q "$$NODE_VERSION"; then \
		echo "Node.js version $$NODE_VERSION is not installed. Installing..."; \
		brew upgrade node-build; \
		git -C /home/ubuntu/.nodenv/plugins/node-build pull; \
		nodenv install $$NODE_VERSION; \
	fi
