import configData from "./config.json";

export default function getMultisigApiUrl() {
    const endpoint = (import.meta.env.MODE === "development") ? configData.MULTISIG_API_LOCAL : configData.MULTISIG_API_URL;
    return endpoint;
}