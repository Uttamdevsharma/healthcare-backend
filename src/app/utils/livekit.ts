import { AccessToken } from "livekit-server-sdk";
import { envVars } from "../config/env";

interface ILiveKitTokenOptions {
    roomName: string;
    identity: string;
    name: string;
    ttl?: string;
}

const createLiveKitAccessToken = async ({
    roomName,
    identity,
    name,
    ttl = "2h",
}: ILiveKitTokenOptions) => {
    const at = new AccessToken(
        envVars.LIVEKIT.LIVEKIT_API_KEY,
        envVars.LIVEKIT.LIVEKIT_API_SECRET,
        {
            identity,
            name,
            ttl,
        },
    );

    at.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: true,
        canSubscribe: true,
    });

    return await at.toJwt();
};

const getLiveKitUrl = () => envVars.LIVEKIT.LIVEKIT_URL;

export const liveKitUtils = {
    createLiveKitAccessToken,
    getLiveKitUrl,
};
