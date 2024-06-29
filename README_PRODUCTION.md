## Building for Production

Our build script is an automated GitHub action. To simulate the build, please follow the steps outlined in the [Latest Release Build](.github/workflows/main.yml) workflow file. 

Clarifications:
- `${{ github.ref }}` should evaluate to `vX.X.X`, where `X.X.X` is the version number.

The built `zip` files can be found in the `dist` directory.
