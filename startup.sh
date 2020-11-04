#! /bin/bash

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
