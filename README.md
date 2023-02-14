[![GitHub Actions Status](https://github.com/ewanharris/setup-pulsar/workflows/Tests/badge.svg?branch=main)](https://github.com/ewanharris/setup-pulsar/actions)

# Setup Pulsar

Downloads [Pulsar](https://pulsar-edit.dev/) and adds `pulsar` and `apm` to the `PATH`.

:note: `apm` is added as Pulsar still ships `apm` rather than the renamed `ppm`

## GitHub Action

### Inputs

#### `version`

The version to test. Default `stable`.

Possible values: `beta`, Any Pulsar [release](https://github.com/pulsar-edit/pulsar/releases) tag

#### `token`

A GitHub token with read permission. Default `secrets.GITHUB_TOKEN`.

The token is used to search Atom releases to find the latest `stable` and `beta` versions.

### Example usage

```yml
uses: ewanharris/setup-pulsar@v3
with:
  version: 'beta'
```

### Full Example

This example runs tests against Atom stable and beta on Linux, Windows, and MacOS.

```yml
jobs:
  Test:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        version: [beta]
    runs-on: ${{ matrix.os }}
    steps:
    - uses: actions/checkout@v3
    - uses: ewanharris/setup-pulsar@v3
      with:
        version: ${{ matrix.version }}
    - name: Pulsar version
      run: pulsar -v
    - name: APM version
      run: apm -v
    - name: Install dependencies
      run: apm ci
    - name: Run tests 🧪
      run: atom --test spec
```
## Credits

This action is a refactor of the [action-setup-atom](https://github.com/UziTech/action-setup-atom) by @UziTech.