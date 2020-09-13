#!/bin/bash

dist=$(pwd)/dist
packages=(common core datasource entry strategy transporter database)

#gulp clean
#gulp build

for package in "${packages[@]}"
do
    cd $dist/$package
    npm publish "$@"
done
