(final: prev: rec {
  nodejs = final.nodejs_22;
  nodePackages = nodejs.pkgs;
  nhost-cli = final.callPackage ./nhost-cli.nix { inherit final; };

  pnpm_10 = final.callPackage "${final.path}/pkgs/development/tools/pnpm/generic.nix" {
    version = "10.0.0";
    hash = "sha256-Q6v25yD7e8U8WRsIYmBcfTI9Cp0t0zvKwHsGLhPPSUg=";
  };
})
