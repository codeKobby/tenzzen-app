import { VideoDetails, PlaylistDetails } from "@/types/youtube"

export function getMockVideoDetails(videoId: string): VideoDetails {
  return {
    id: videoId,
    type: "video",
    title: "Sample Video Title",
    description: "This is a sample video description that would normally come from a real YouTube video.",
    thumbnail: "https://i.ytimg.com/vi/placeholder/maxresdefault.jpg",
    duration: "12:34",
    channelId: "sample-channel",
    channelName: "Sample Channel",
    views: "1.2M",
    likes: "45K",
    publishDate: "Mar 1, 2024"
  }
}

export function getMockPlaylistDetails(playlistId: string): PlaylistDetails {
  return {
    id: playlistId,
    type: "playlist",
    title: "Sample Playlist",
    thumbnail: "https://i.ytimg.com/vi/placeholder/maxresdefault.jpg",
    channelId: "sample-channel",
    channelName: "Sample Channel",
    videoCount: "5",
    videos: [
      {
        id: "video1",
        title: "Sample Video 1",
        description: "Description for video 1",
        thumbnail: "https://i.ytimg.com/vi/placeholder1/maxresdefault.jpg",
        duration: "10:00",
        channelId: "sample-channel",
        channelName: "Sample Channel",
        views: "100K",
        publishDate: "Mar 1, 2024"
      },
      {
        id: "video2",
        title: "Sample Video 2",
        description: "Description for video 2",
        thumbnail: "https://i.ytimg.com/vi/placeholder2/maxresdefault.jpg",
        duration: "15:00",
        channelId: "sample-channel",
        channelName: "Sample Channel",
        views: "200K",
        publishDate: "Mar 2, 2024"
      },
      {
        id: "video3",
        title: "Sample Video 3",
        description: "Description for video 3",
        thumbnail: "https://i.ytimg.com/vi/placeholder3/maxresdefault.jpg",
        duration: "20:00",
        channelId: "sample-channel",
        channelName: "Sample Channel",
        views: "300K",
        publishDate: "Mar 3, 2024"
      }
    ]
  }
}
