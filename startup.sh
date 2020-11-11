#! /bin/bash

# 根据某些条件判断bfchain是否已经授权成功并启动
if [[ ! -e /path/to/bfchain ]]
then
    sudo su root
    # 修改root用户密码
    passwd root << EOF
    $1
    $1
EOF

    # 获取序列号
    seqNum=$(/var/local/mysh/seqNum.sh)

    # http请求获取授权文件
    curl https://down.sandai.net/thunderx/XunLeiWebSetup10.1.38.890.exe --output /var/local/mysh/xunlei.exe

    # 重启BFChain
    echo "success" > /var/local/mysh/success
fi