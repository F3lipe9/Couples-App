{ pkgs, ... }:
{
  devShells.default = pkgs.mkShell {
    name = "fullstack-dev";
    packages = [
      pkgs.nodejs_20
      pkgs.nodePackages.npm
      pkgs.python312
      pkgs.python312Packages.pip
      pkgs.python312Packages.virtualenv
      pkgs.python312Packages.python-lsp-server
      pkgs.stdenv.cc.cc.lib
    ];
    shellHook = ''
      # Set up Python virtual environment
      if [ ! -d ".venv" ]; then
        python -m venv .venv
      fi
      source .venv/bin/activate
      
      # Install dependencies
      pip install -r Backend/requirements.txt
      npm install
      
      echo "Development environment ready!"
    '';
    env = {
      PYTHONPATH = "./Backend";
    };
  };

  idx.extensions = [
    "svelte.svelte-vscode"
    "vue.volar"
    "ms-python.debugpy"
    "ms-python.python"
  ];

  idx.previews = {
    previews = {
      web = {
        command = [ "npm" "run" "dev" "--" "--port" "$PORT" "--host" "0.0.0.0" ];
        manager = "web";
      };
      backend = {
        command = [ "python" "Backend/main.py" ];
        manager = "web";
      };
    };
  };
}
