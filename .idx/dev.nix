{pkgs}: {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs_20,
    pkgs.python312,
    pkgs.python312Packages.pip,
    pkgs.python312Packages.virtualenv,
    pkgs.stdenv.cc.cc.lib
  ];
  idx.extensions = [
    "svelte.svelte-vscode",
    "vue.volar"
  ];
  idx.previews = {
    previews = {
      web = {
        command = [ "npm", "run", "dev", "--", "--port", "$PORT", "--host", "0.0.0.0" ];
        manager = "web";
      };
    };
  };
  enterShell = ''
    if [ ! -d ".venv" ]; then
      python -m venv .venv
    fi
    source .venv/bin/activate
    pip install -r Backend/requirements.txt
  '';
}