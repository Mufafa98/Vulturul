class Song {
    constructor(source, title, thumbnail_url, author) {
        this.source = source;
        this.title = title;
        this.thumbnail_url = thumbnail_url;
        this.author = author;
    }
}

export class MusicPlayer {
    constructor() {
        this.queue = [];
        this.playing = undefined;
        this.repeat = false;

        this.add = this.add.bind(this);
        this.play = this.play.bind(this);
        this.setRepeat = this.setRepeat.bind(this);
        this.next = this.next.bind(this);
        this.stop = this.stop.bind(this);
        this.previous = this.previous.bind(this);
        this.whatToPlay = this.whatToPlay.bind(this);
        this.countWaiting = this.countWaiting.bind(this);
        this.currentSong = this.currentSong.bind(this);

    }

    add(song, thumbnail_url, title, author) {
        this.queue.push(new Song(song, title, thumbnail_url, author));
    }

    whatToPlay() {
        if (this.playing === undefined) {
            return undefined;
        }
        return this.playing.source;
    }

    countWaiting() {
        return this.queue.length;
    }

    currentSong() {
        return this.playing;
    }

    play() {
        // if (this.queue.length === 0) {
        //     this.playing = undefined;
        // }
        const music = this.queue[0];
        this.playing = music;
        this.queue.shift();
        if (this.repeat) {
            this.queue.push(music);
        }
    }

    setRepeat() {
        if (this.repeat) {
            this.repeat = false;
            this.queue.pop();
            return;
        }
        this.queue.push(this.playing);
        this.repeat = true;
    }

    next() {
        this.play();
    }

    previous() {
        if (this.playing !== undefined) {
            this.queue.unshift(this.playing);
        }
        this.play();
    }

    stop() {
        this.queue = [];
        this.playing = [];
    }
}