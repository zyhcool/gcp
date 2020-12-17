user=$1
remotehost=$2

ssh ${user}@${remotehost} -o stricthostkeychecking=no "supervisor stop bcf" > /dev/null


