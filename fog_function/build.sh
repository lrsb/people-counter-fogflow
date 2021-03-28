mvn clean install
#replace the tag if you want to modify the fog function
#the modified version must be uploaded to docker hub
docker build -t "lrsb/peoplecounter" .
docker push lrsb/peoplecounter
