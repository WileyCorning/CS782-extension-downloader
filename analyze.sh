#!/bin/sh

# rename .vsix to .zip
for f in *.vsix; do 
    mv -- "$f" "${f%.vsix}.zip"
done

# # extract all .zip files
for zip in *.zip
do
  dirname=`echo $zip | sed 's/\.zip$//'`
  if mkdir "$dirname"
  then
    if cd "$dirname"
    then
      unzip ../"$zip"
      cd ..
      # rm -f $zip # Uncomment to delete the original zip file
    else
      echo "Could not unpack $zip - cd failed"
    fi
  else
    echo "Could not unpack $zip - mkdir failed"
  fi
done

# iterate through directories
export PATH=$PATH:/Users/amandaxu/Downloads/sonar-scanner-4.6.2.2472-macosx/bin
for d in */ ; do
    cd "$d/extension/"
    sonar-scanner \
    -Dsonar.projectKey=${d%/} \
    -Dsonar.sources=. \
    -Dsonar.host.url=http://localhost:9000 \
    -Dsonar.login=cdfc7ff84f8676b407d28dcc8695dc0e818f5ec1
    cd ../../
done