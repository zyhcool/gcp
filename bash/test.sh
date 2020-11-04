#! /bin/bash

if [[ -e /e/demo/googleCloudPlatform/bash/test.sh ]]
then
    pwd=$(cd $(dirname $0); pwd)

    echo $pwd
    echo $1 > name
    ## 重定向
    $pwd/name.sh << EOF
    $1
    $1
EOF

    # 获取命令输出，保存到变量
    seqNum=$(./seqNum.sh)

    # http请求，下载文件到指定地址
    # https://down.sandai.net/thunderx/XunLeiWebSetup10.1.38.890.exe

    # curl https://down.sandai.net/thunderx/XunLeiWebSetup10.1.38.890.exe --output ./xunlei.exe

    echo $(dirname $0)
else
    echo "jjjjjjjj"
fi


