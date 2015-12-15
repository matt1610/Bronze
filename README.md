# Bronze
Node Streaming Video
Streaming video for bronze beach raspberry pi

raspivid -o myvid.h264 -t 10000
ffmpeg -r 15 -i myvid.h264 -vcodec copy outputfile.mp4