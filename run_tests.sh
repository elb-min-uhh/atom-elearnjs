#!/bin/bash

# Lässt alle Tests laufen
my_dir=`dirname $0`

# build up test files string
TESTS=""

# for folder util
for file in $my_dir/test/util/*; do
    [ -e "$file" ] || continue
    TESTS="$TESTS $file"
done

nodeunit $TESTS
