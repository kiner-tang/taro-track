/**
 * @date 2020-09-12
 * @author kinertang
 * @description
 */

import { task } from "gulp";
import { rm } from "shelljs";
import { join, resolve } from "path";
import { dist } from "./config";

const root = join(resolve());

task("clean", (done: () => void) => {
  rm("-rf", join(root, dist, "*"));
  done();
});
