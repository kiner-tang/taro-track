/**
 * @date 2020-09-12
 * @author kinertang
 * @description
 */

import { TaroTrackModules } from '../../../dolphin-wx-modules';
import { source, dist } from "./config";
import { src, task, watch, series, dest } from "gulp";
import { createProject, Project } from "gulp-typescript";
// @ts-ignore
import * as alias from "gulp-ts-alias";
// @ts-ignore
import * as sourcemaps from "gulp-sourcemaps";
import * as log from "fancy-log";
import { join, resolve } from "path";

const root: string = join(resolve());
const modules: string[] = TaroTrackModules;

/**
 * Watches the packages/* folder and
 * builds the package on file change
 */
function defaultTask() {
  log.info("Watching files..");
  modules.forEach(name => {
    watch(
      [`${source}/${name}/**/*.ts`, `${source}/${name}/*.ts`],
      series(name)
    );
  });
}

/**
 * Builds the given package
 * @param name The name of the package
 */
function buildPackage(name: string) {
  const pack: Project = createProject(join(root, source, `${name}/tsconfig.json`));
  const project: Project = createProject(join(root, "tsconfig.base.json"));
  const pathname: string = join(root, source, name);
  const output: string = `${dist}/${name}`;

  return pack
    .src()
    .pipe(alias({ configuration: project.config }))
    .pipe(pack())
    .pipe(dest(`${output}/lib`))
    .pipe(src([`${pathname}/package.json`])
    .pipe(dest(output)));
}

/**
 * Builds the given package
 * @param name The name of the package
 */
function buildESPackage(name: string) {
  const pack: Project = createProject(join(root, source, `${name}/tsconfig.es.json`));
  const es: Project = createProject(join(root, "tsconfig.base.es.json"));
  const output: string = `${dist}/${name}`;

  return pack
    .src()
    .pipe(alias({ configuration: es.config }))
    .pipe(pack())
    .pipe(dest(`${output}/es`));
}

/**
 * Builds the given package and adds sourcemaps
 * @param name The name of the package
 */
function buildPackageDev(name: string) {
  const pack: Project = createProject(join(root, source, `${name}/tsconfig.json`));
  const project: Project = createProject(join(root, "tsconfig.base.json"));

  return pack
    .src()
    .pipe(alias({ configuration: project.config }))
    .pipe(sourcemaps.init())
    .pipe(pack())
    .pipe(
      sourcemaps.mapSources(
        (sourcePath: string) => "./" + sourcePath.split("/").pop()
      )
    )
    .pipe(sourcemaps.write(".", {}))
    .pipe(dest(`${dist}/${name}/lib`));
}

modules.forEach(name => {
  task(`${name}:dist`, () => buildPackage(name));
  task(`${name}:es`, () => buildESPackage(name));
  task(`${name}:dev`, () => buildPackageDev(name));
  task(name, series([`${name}:dist`, `${name}:es`]));
});

task("common:dev", series(modules.map(name => `${name}:dev`)));
task("build", series(modules));
task("build:dev", series("common:dev"));
task("default", defaultTask);
