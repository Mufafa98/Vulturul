from pytubefix import YouTube, Playlist
import os
import sys

link = sys.argv[1]
# link = "https://music.youtube.com/playlist?list=PLV5acDnDKxtC6XnKkpFZb44Lbj27L-WYr&si=UadqgDEyQ_7ND5AN"
destination = os.path.join(
    ".", 
    "src", 
    "commands", 
    "music_player", 
    "cache"
)

def download_video(video_link, destination):
    yt = YouTube(video_link)
    # name = yt.title.replace("?", "").replace("/", "").replace("\\", "")
    name = video_link.split("/")[-1].replace("?", "").replace("/", "").replace("\\", "")
    file_path = os.path.join(destination, name + ".mp3")
    thumb_url = yt.thumbnail_url
    title = yt.title

    if os.path.exists(file_path):
        sys.stdout.buffer.write(f"{file_path} {thumb_url} {title}\n".encode("utf-8"))
        sys.stdout.flush()
    else:
        video = yt.streams.filter(only_audio=True).order_by("abr").desc().first()
        out_file = video.download(output_path=destination, filename=name)

        base, ext = os.path.splitext(out_file)
        new_file = base + '.mp3'
        os.rename(out_file, new_file)

        sys.stdout.buffer.write(f"{file_path} {thumb_url} {title}\n".encode("utf-8"))
        sys.stdout.flush()

sys.stdout.buffer.write("start".encode("utf-8"))
sys.stdout.flush()
if "playlist" in link:
    playlist = Playlist(link)
    for video_link in playlist.video_urls:
        download_video(video_link, destination)
else:
    download_video(link, destination)
sys.stdout.buffer.write("done".encode("utf-8"))
sys.stdout.flush()
