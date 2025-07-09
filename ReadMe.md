
# Jelly Music

This guide describes the **Jelly Music** Docker container. While currently runnable outside of Docker, these instructions will apply once the Docker container is finalized and tested.

---

## What is Jelly Music?

Jelly Music is a **self-hosted Alexa Skill** designed for your Jellyfin server. It allows you to stream and play music on your Alexa devices using voice commands like:

* "Alexa, ask Jelly Music to play album **Creeping Death** by Metallica."
* "Alexa, ask Jelly Music to shuffle songs by **Black Sabbath**."

---

## Alpha Software Disclaimer

Please note that **Jelly Music** is a side project I'm developing in my spare time.

* There's **no guarantee** of ongoing maintenance or updates.
* Not all features will be thoroughly tested upon release, so exercise **caution when updating**.
* This software comes with **no guarantees of functionality**. I am not an experienced programmer; I'm simply an enthusiast with a hobby.

---

## Legal Disclaimer

By using **Jelly Music**, you are confirming that you have the **necessary licenses or ownership rights** for the music on your Jellyfin server. This skill was **not created or intended for illegal downloading or piracy**.

---

## Requirements

To run a Jelly Music instance, you will need:

* A basic understanding of setting up **Docker containers**.
* The ability to log into the **Alexa Developer Dashboard** (creating an account is straightforward).
* A self-hosted Jellyfin server accessible via a **public address** and secured with a **trusted SSL certificate**.
* A Docker container capable of running the Jelly Music server, also accessible via a **public address** and secured with a **trusted SSL certificate**.
* **Recommendation:** Set up an **NGINX reverse proxy server** and **Dynamic DNS (DDNS)** to achieve the public accessibility and trusted certificates.

---

## Installation Instructions

1.  Set up the Docker container using the provided **Docker image**.
2.  Ensure you **enable the necessary port** in your Docker configuration.
3.  Configure the **environment variables** as outlined in the "Configuration Requirements" section.

---

## Configuration Requirements

The following environment variables are **required**:

* **`JELLYFIN_HOST`**: The public address of your Jellyfin server.
* **`JELLYFIN_KEY`**: The API key for your Jellyfin server.
* **`SKILL_NAME`**: The two-word name Alexa will use to refer to your Jellyfin server (e.g., "Jelly Music").
* **`PORT`**: The Port your server will use (remember to enable this port on Docker).

**Note:** Your public address for the server needs to run on port `443`, and your reverse proxy should handle the redirect to the specified `PORT`.

---

## Alexa Skill Setup

1.  Create an account on the **Alexa Developer Console** using your Amazon account: [https://developer.amazon.com](https://developer.amazon.com)
2.  Create a **new skill** named `Jelly Music`.
3.  For "Type of experience," select **"Music & Audio"**.
4.  For the "Model," choose **"Custom"**.
5.  For "Hosting Service," choose **"Provision your own"**.

**Note:** This container will **not** work with Alexa-Hosted skills.

Once your Alexa Skill is created, you need to configure it. This might seem daunting, but it's quite simple as most of the work has been done for you.

1.  Navigate to **"Endpoint"** and select **"HTTPS"**. Set "Default Region" to the **public address of your Jelly Music server**.
2.  Navigate to **"Interfaces"** and **enable "Audio Player"**. This is crucial for audio streaming, and the skill will not function without it.
3.  Grab the preconfigured Alexa Skill JSON file from here: [https://github.com/Rusketh/JellyMusic/blob/main/skill/skill.json](https://github.com/Rusketh/JellyMusic/blob/main/skill/skill.json)
4.  Change `interactionModel.languageModel.invocationName` (line 4 in the JSON file) to the name you used for the **`SKILL_NAME` environment variable**, then save the file.
5.  Navigate to **"Interaction Model"** and open the **"JSON Editor"**. Drag your saved JSON file into the editor (or copy and paste its contents).

That's it! Click **"Save"** at the top, then hit **"Build Skill"**. Hopefully, after a few minutes, it will build successfully, and you'll be ready to go. Start the container and enjoy listening to your music!

---

## Commands

You can use the following commands with Alexa:

"Alexa, ask Jelly Music to..."

* **Play/Shuffle/Queue** the album `{album name}` [by `{artist name}`]
* **Play/Shuffle/Queue** songs by `{artist name}`
* **Play/Queue** `{song name}` [by `{artist name}`]
* **Play/Queue/Shuffle** playlist `{playlist name}`

---

## Help Developing

As mentioned, this is a work in progress, and I'm not the most skilled programmer. I would be very grateful to anyone who contributes a **Pull Request (PR)** to this project. All I ask is that you try to adhere to my coding style and **test your work** before committing.
