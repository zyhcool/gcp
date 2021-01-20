

path=/e/demo/googleCloudPlatform1

# [ -e /e/demo/googleCloudPlatform ]
if [ ! -e ${path} ]
then 
    ha='true'
else 
    ha='false'
fi
echo ${ha}

if [ "${ha}" = "true" ]
then
    echo 'it is true'
else
    echo 'it is false'
fi