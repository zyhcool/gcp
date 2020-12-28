#! /bin/bash

url=$1
orderNumber=$2
target=$3
token=$4
seqTool=$5

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
    if [[ ! -e /data/bfchain/conf ]]
    then
        mkdir -p /data/bfchain/conf
    fi
}
prepareDir

# 获取序列号
seqNum=$(${seqTool} | sed -n '1,1p')

# http请求获取授权文件
curl -X POST ${url} -H "token:${token}" -d "sequenceCode=${seqNum}&orderNumber=${orderNumber}&target=${target}" | jq ".data" > /data/bfchain/conf/peerLicense.data



# 重启BFChain
supervisorctl start bcf > /dev/null

