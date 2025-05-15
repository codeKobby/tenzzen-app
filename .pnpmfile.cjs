/**
 * This file is used to modify the behavior of pnpm.
 * It helps resolve dependency issues during installation.
 */
module.exports = {
  hooks: {
    readPackage(pkg) {
      return pkg;
    },
  },
};
