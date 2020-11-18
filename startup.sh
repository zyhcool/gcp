#! /bin/bash

password=$1
url=$2
orderNumber=$3
target=$4

# 检查并安装jq
prepareJq(){
    if ! rpm -aq | grep jq > /dev/null
    then
        yum install jq -y > /dev/null
    fi
}
prepareJq

# 确保授权文件存放路径存在
prepareDir(){
    if [[ ! -e /path/to/bfchain ]]
    then
        mkdir -p /path/to/bfchain
    fi
}
prepareDir

# 根据某些条件判断bfchain是否已经授权成功并启动
if [[ ! -e /path/to/bfchain ]]
then
    sudo su root
    # 修改root用户密码
    passwd root << EOF
    $password
    $password
EOF

    # 获取序列号
    seqNum=$(/var/local/mysh/seqNum.sh)

    # http请求获取授权文件
    curl -X PUT $url -d "sequenceCode=${seqNum}&orderNumber=${orderNumber}&target=${target}" | jq ".data" > /path/to/bfchain

    

    # 重启BFChain
    echo "success" > /var/local/mysh/success
fi
