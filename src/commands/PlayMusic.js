import { spawn } from 'node:child_process';
import { MusicPlayer } from './music_player/MusicPlayer.js';
import chalk from 'chalk';
import { log } from '../utils/Logger.js';

import {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    NoSubscriberBehavior,
    AudioPlayerStatus,
    getVoiceConnection
} from '@discordjs/voice';

import {
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    CommandInteraction,
} from 'discord.js';

const musicPlayer = new MusicPlayer();
let audioPlayer = undefined;
let audioResource = undefined;
let connection = undefined;

let musicEmbed = undefined;
let controlButtons = undefined;
let musicController = undefined;
let collector = undefined;

let musicListEmbed = undefined;
let musicListButton = undefined;
let musicListCollector = undefined;
let musicListController = undefined;

async function DownloadSong(url, author) {
    log(`[${chalk.grey("Info")}][${chalk.blue("Download")}] Downloading from ${url}`);
    let downloaded = false;
    const downloaderProcess = spawn(
        'python',
        [
            './src/commands/music_player/Downloader.py',
            url
        ]
    );
    let status = 0;
    downloaderProcess.stdout.on('data', (data) => {
        const stringData = data.toString().trim();
        if (stringData === 'start') {
            log(`[${chalk.grey("Info")}][${chalk.blue("Download")}] Downloading song from ${url}`);
            status = 1;
        }
        else if (stringData === 'done') {
            log(`[${chalk.green("Success")}][${chalk.blue("Download")}] Song downloaded from ${url}`);
            status = 2;
        }
        else if (status === 1) {
            const source = stringData.split(' ')[0];
            const thumbnail = stringData.split(' ')[1];
            const title = stringData.split(' ').slice(2).join(' ');
            musicPlayer.add(source, thumbnail, title, author);
            log(`[${chalk.green("Success")}][${chalk.blue("Download")}] Song downloaded from ${url}. Title: ${title}`);
        } else if (status === 2) {
            downloaded = true;
        }
    });

    downloaderProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
        log(`[${chalk.red("Error")}][${chalk.blue("Download")}] Error downloading song from ${url}. Reason: ${data}`);
    });

    downloaderProcess.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
        downloaded = true;
    });

    while (downloaded === false) {
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    log(`[${chalk.green("Success")}][${chalk.blue("Download")}] Song downloaded!`);
}

function createMusicEmbed() {
    const embed = new EmbedBuilder()
        .setAuthor({
            name: `Dedicatie💰speciala💰de la fratele nostru 👑 ${musicPlayer.currentSong().author} 👑`,
        })
        .setTitle("Difuzoarele la maxim 🔊🔊🔊 ca se canta")
        .setDescription(`${musicPlayer.currentSong().title}`)
        .setThumbnail(musicPlayer.currentSong().thumbnail_url)
        .setColor("#00b0f4")
    return embed;
}

function createMusicListEmbed() {
    const playing = musicPlayer.currentSong().title;
    let waiting = "";
    const waitingList = [];
    let counter = 1;
    for (let i = 0; i < musicPlayer.queue.length; i++) {
        const temp = `${waiting}${counter}. ${musicPlayer.queue[i].title}\n`
        if (temp.length > 1000) {
            waitingList.push(waiting);
            waiting = "";
        }
        waiting += `${counter}. ${musicPlayer.queue[i].title}\n`;
        counter++;
    }
    if (waiting.length > 0) {
        waitingList.push(waiting);
    }
    try {
        const embed = new EmbedBuilder()
            .setAuthor({
                name: "🎤 Bossule, avem numai hituri grele diseară! 🔥💸",
            });
        if (waitingList.length < 1) {
            embed.addFields({
                name: "💿 Mai tarziu nu stiu ce cantam",
                value: "🤷‍♂️",
                inline: false
            });
        }
        else {
            embed.addFields({
                name: "💿 Pe listă avem de toate",
                value: " ",
                inline: false
            });
            for (let i = 0; i < waitingList.length; i++) {
                console.log(waitingList[i]);
                embed.addFields({
                    name: " ",
                    value: waitingList[i],
                    inline: false
                });
            }
        }
        embed.addFields({
            name: "Da acuma pe loc se canta",
            value: playing.toString(),
            inline: false
        });
        return embed;
    }
    catch (e) {
        console.log(e);
    }

}

async function showMusicList(commandChannel) {
    const collectorFilter = () => true;
    if (musicListEmbed === undefined) {
        musicListEmbed = createMusicListEmbed();
    }
    if (musicListButton === undefined) {
        musicListButton = new ButtonBuilder()
            .setCustomId('closeList')
            .setLabel('OK Boss')
            .setEmoji('💪')
            .setStyle(ButtonStyle.Success);
    }
    if (musicListController === undefined) {
        musicListController = await commandChannel.send({
            embeds: [musicListEmbed],
            components: [new ActionRowBuilder().addComponents([musicListButton])],
            withResponse: true,
        });
    }
    if (musicListCollector === undefined) {
        musicListCollector = musicListController.awaitMessageComponent({ filter: collectorFilter, time: 60000 });

        musicListCollector.then(async i => {
            if (i.customId === 'closeList') {
                await i.deferUpdate();
                await i.message.delete();
                musicListEmbed = undefined;
                musicListButton = undefined;
                musicListController = undefined;
                musicListCollector = undefined;
            }
        }).catch(console.error);
    }
}


class ControlButtons {
    constructor(musicPlayer) {
        this.leaveButton = new ButtonBuilder()
            .setCustomId('stop')
            .setLabel('Stop')
            .setEmoji('🛑')
            .setStyle(ButtonStyle.Danger);
        this.pauseButton = new ButtonBuilder()
            .setCustomId('pause')
            .setLabel('Pause')
            .setEmoji('⏸️')
            .setStyle(ButtonStyle.Success);
        this.nextButton = new ButtonBuilder()
            .setCustomId('next')
            .setLabel('Next')
            .setEmoji('⏭️')
            .setDisabled(musicPlayer.countWaiting() === 0)
            .setStyle(ButtonStyle.Secondary);
        this.repeatButton = new ButtonBuilder()
            .setCustomId('repeat')
            .setLabel('Repeat')
            .setEmoji('🔁')
            .setStyle(ButtonStyle.Primary);
        this.infoButton = new ButtonBuilder()
            .setCustomId('info')
            .setLabel('List songs')
            .setEmoji('ℹ️')
            .setStyle(ButtonStyle.Secondary);
        this.pauseState = false
        this.repeatState = false

        this.getRow = this.getRow.bind(this);
        this.pause = this.pause.bind(this);
        this.repeat = this.repeat.bind(this);
    }

    getRow() {
        return new ActionRowBuilder()
            .addComponents(
                this.leaveButton,
                this.pauseButton,
                this.nextButton,
                this.repeatButton,
                this.infoButton
            );
    }

    pause() {
        this.pauseState = !this.pauseState;
        if (this.pauseState) {
            this.pauseButton.setEmoji('▶️');
            this.pauseButton.setLabel('Play');
        } else {
            this.pauseButton.setEmoji('⏸️');
            this.pauseButton.setLabel('Pause');
        }
    }

    repeat() {
        this.repeatState = !this.repeatState;
        if (this.repeatState) {
            this.repeatButton.setEmoji('🔁');
            this.repeatButton.setLabel('Sequential');
        } else {
            this.repeatButton.setEmoji('🔁');
            this.repeatButton.setLabel('Repeat');
        }
        this.next();
    }

    next() {
        this.nextButton.setDisabled(musicPlayer.countWaiting() === 0);
    }
}

/// Check if th requirements for entering a voice channel are met
function CanJoinVoice(message, params) {
    // Check if the user provided one URL
    if (params.length === 0) {
        message.reply('You need to provide a URL!');
        log(`[${chalk.yellow("Warning")}][${chalk.blue("Play")}] User ${message.author.username} did not provide a valid URL`);
        return false;
    }
    if (params.length > 1) {
        message.reply('You can only provide one URL!');
        log(`[${chalk.yellow("Warning")}][${chalk.blue("Play")}] User ${message.author.username} provided more than one URL`);
        return false;
    }
    // Check if the user is in a voice channel
    const channel = message.member.voice.channel;
    if (!channel) {
        message.reply('You need to join a voice channel first!');
        log(`[${chalk.yellow("Warning")}][${chalk.blue("Play")}] User ${message.author.username} is not in a voice channel`);
        return false;
    }
    return true;
}

function JoinVoiceChannel(message) {
    const channel = message.member.voice.channel;
    connection = getVoiceConnection(channel.guild.id);
    if (connection === undefined) {
        connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });
    }
}

function CreateAudioPlayer() {
    if (audioPlayer === undefined) {
        audioPlayer = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause,
            },
        });
        audioPlayer.on('error', error => {
            console.error('Error:', error.message, 'with track', error.resource.metadata);
        });
        audioPlayer.on(AudioPlayerStatus.Idle, () => {
            PlayNext();
        });
    }
}

function CreateAudioResource() {
    if (audioResource === undefined) {
        musicPlayer.play();
        audioResource = createAudioResource(musicPlayer.whatToPlay());
    }
}

export async function PlayHandler(message, params) {
    if (!CanJoinVoice(message, params)) {
        return;
    }
    await DownloadSong(
        params[0],
        message.member.nickname || message.author.username
    );
    JoinVoiceChannel(message);
    log(`[${chalk.green("Success")}][${chalk.blue("Play")}] Bot joined voice channel`);
    CreateAudioPlayer();
    CreateAudioResource();
    log(`[${chalk.green("Success")}][${chalk.blue("Play")}] Audio player and resource created`);
    const commandChannel = message.channel;

    connection.subscribe(audioPlayer);
    audioPlayer.play(audioResource);
    log(`[${chalk.green("Success")}][${chalk.blue("Play")}] Audio player started playing ${musicPlayer.currentSong().title}`);

    musicEmbed = createMusicEmbed();

    if (musicController === undefined) {
        controlButtons = new ControlButtons(musicPlayer);
        musicController = await commandChannel.send({
            embeds: [musicEmbed],
            components: [controlButtons.getRow()],
            withResponse: true,
        });
    } else {
        controlButtons.next();
        musicController.edit({
            embeds: [musicEmbed],
            components: [controlButtons.getRow()],
            withResponse: true,
        })
    }

    const collectorFilter = () => true;

    if (collector === undefined) {
        collector = musicController.createMessageComponentCollector({ collectorFilter });

        collector.on('collect', async i => {
            i.deferUpdate();
            if (i.customId === 'stop') {
                await Disconect();
                await i.message.delete();
            } else if (i.customId === 'pause') {
                await PauseAudioPlayer();
                controlButtons.pause();
                await musicController.edit({
                    components: [controlButtons.getRow()],
                    withResponse: true,
                });
            } else if (i.customId === 'repeat') {
                await Repeat();
                controlButtons.repeat();
                await musicController.edit({
                    components: [controlButtons.getRow()],
                    withResponse: true,
                });
            } else if (i.customId === 'next') {
                await PlayNext();
                controlButtons.next();
                await musicController.edit({
                    embeds: [musicEmbed],
                    components: [controlButtons.getRow()],
                    withResponse: true,
                });
            } else if (i.customId === 'info') {
                await showMusicList(commandChannel);
            }
        });
    }
    log(`[${chalk.green("Success")}][${chalk.blue("Play")}] Music Control panel created`);


    message.delete();
}

export async function PauseAudioPlayer() {
    if (audioPlayer.state.status === AudioPlayerStatus.Paused) {
        audioPlayer.unpause();
        log(`[${chalk.green("Success")}][${chalk.blue("Pause")}] Audio player unpaused on ${musicPlayer.currentSong().title}`);
    } else {
        audioPlayer.pause();
        log(`[${chalk.green("Success")}][${chalk.blue("Pause")}] Audio player paused on ${musicPlayer.currentSong().title}`);
    }
}

export async function Repeat() {
    musicPlayer.setRepeat();
    log(`[${chalk.green("Success")}][${chalk.blue("Repeat")}] Repeat state changed to ${musicPlayer.repeat}`);
}

export async function PlayNext() {
    musicPlayer.next();
    if (musicPlayer.whatToPlay() !== undefined) {
        audioResource = createAudioResource(musicPlayer.whatToPlay());
        audioPlayer.play(audioResource);
        musicEmbed = createMusicEmbed();
        log(`[${chalk.green("Success")}][${chalk.blue("Next")}] Next song is ${musicPlayer.currentSong().title}`);
    } else {
        Disconect();
    }
}

export async function Disconect() {
    // TODO: Delete last message when leaving
    connection.destroy();
    musicPlayer.stop();
    connection = undefined;
    audioPlayer = undefined;
    audioResource = undefined;
    musicEmbed = undefined;
    controlButtons = undefined;
    musicController = undefined;
    log(`[${chalk.green("Success")}][${chalk.blue("Leave")}] Bot left voice channel`);
}