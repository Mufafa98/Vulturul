from pytubefix import YouTube
import os
import sys

link = sys.argv[1]
destination = os.path.join(
    ".", 
    "src", 
    "commands", 
    "music_player", 
    "cache"
    )
name = link.split("/")[-1].replace("?", "") 

file_path = os.path.join(destination, name + ".mp3")

yt = YouTube(link)
thumb_url = yt.thumbnail_url
title = yt.title

if os.path.exists(file_path):
    sys.stdout.buffer.write(f"{file_path} {thumb_url} {title}".encode("utf-8"))
else:
    video = yt.streams.filter(only_audio=True).order_by("abr").desc().first()
    out_file = video.download(output_path=destination, filename=name)

    base, ext = os.path.splitext(out_file)
    new_file = base + '.mp3'
    os.rename(out_file, new_file)

    sys.stdout.buffer.write(f"{file_path} {thumb_url} {title}".encode("utf-8"))

