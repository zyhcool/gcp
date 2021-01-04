

# token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJiaW5kaW5nR2Vuc2lzQmxvY2tTaWduYXR1cmVzIjpbXSwicGFzc3dvcmQiOiIxZGNjYjIyZTQ2NmY2NTQ4Y2ZjY2U2NzkzM2Y5NWJmYzE1MmRjMWRjZDJkN2ZlOWJmZTAxZDVkYTYzMmNkYTZiIiwiZW1haWwiOiIxMzEwNTAyNzYyMEAxNjMuY29tIiwibmFtZSI6IuW8gOWPkeiAhei0puWPtyIsInJvbGUiOjMsInN0YXR1cyI6MCwidWlkIjoiNzJkNzUyMGUtN2Q0OS0zNTljLTgyODYtYWVjYmJiODAwMDNkIiwiY3JlYXRlZEF0IjoiMjAyMC0xMS0yNFQxMTo0MTozMi4wOTNaIiwidXBkYXRlZEF0IjoiMjAyMS0wMS0wMVQwOToyNTo1My4xMjVaIiwiaWF0IjoxNjA5NTU1MzA3LCJleHAiOjE2MDk1NTg5MDd9.qNcFdrUBOlIbxn08Hyxj8115NP68D6vEN6otmy18sow"
# seq="e63e5e5cff078857ca5c1d6a4a03c6e7d5e6eb1784fedc90a6ba0fbc5b913460"

# curl -X POST http://34.96.179.189:880/authorize -H "token:${token}" -d "sequenceCode=${seq}&orderNumber=orderNumber&target=target"



retryNum=$1

bcfNum=$(ps aux | grep bcf | grep -v grep | wc -l)

while [ "${bcfNum}" -eq 0 ] && [ "${retryNum}" -gt 0 ]
do
    sleep 3s
    ((retryNum-=1))
    echo $bcfNum
    bcfNum=$(ps aux | grep bcf | grep -v grep | wc -l)
    echo $bcfNum
    echo $retryNum
done

echo 'finish'
