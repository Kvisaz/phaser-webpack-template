import {AlignObject} from "@kvisaz/phaser-sugar";

export interface IFontAsset {
    url: string;
    name: string;
    fontFamily: string;
}

export interface ImageAsset {
    readonly name: string;
    readonly url: string;
    readonly fallbackUrls?: string[];
}

export interface IUrlFrameData {
    url: string,
    frameName?: string
}

export interface ISoundAsset {
    name: string;
    url: string;
}

export interface IAtlasAsset {
    name: string;
    pngUrl: string;
    jsonUrl: string;
}

export interface IAssets {
    images: Readonly<ImageAsset[]>;
    sounds: Readonly<ISoundAsset[]>;
    atlases: Readonly<IAtlasAsset[]>;
    fonts: Readonly<IFontAsset[]>;
}

/** Связь между конкретными ассетами и игрой - элементарные блоки
 *  билдер возвращает Image, Container, NineSlice, в черновиках - Text
 * **/
export type ViewElement = Phaser.GameObjects.GameObject & AlignObject;
export type ViewElementBuilder = () => ViewElement;
