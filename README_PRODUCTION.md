## Building for Production

Run the following:

```bash
yarn
yarn build:production --env version=v1.0.0 # replace with extension version
yarn package
```

The built `zip` files can be found in the `dist` directory.
