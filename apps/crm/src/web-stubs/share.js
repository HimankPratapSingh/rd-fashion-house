// Web stub for react-native-share
const Share = {
  share: async ({ message, title }) => {
    if (navigator.share) {
      await navigator.share({ title, text: message });
    } else {
      await navigator.clipboard.writeText(message);
      alert('Copied to clipboard!');
    }
    return { action: 'sharedAction' };
  },
};

export default Share;
