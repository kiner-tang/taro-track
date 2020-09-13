/**
 * @date 2020-09-12
 * @author kinertang
 * @description
 */

import { task, src, dest } from "gulp";
import { dist, source } from "./config";
import { getFolders } from "../helpers";

const packages: string[] = getFolders(source);

task("copy-misc", function(): NodeJS.ReadWriteStream {
  const misc = src(["README.md", "LICENSE", ".npmignore"]);

  return packages.reduce(
    (stream, name) => stream.pipe(dest(`${dist}/${name}`)),
    misc
  );
});
