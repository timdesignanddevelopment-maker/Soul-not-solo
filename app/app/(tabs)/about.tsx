import { ScrollView, StyleSheet, Text } from "react-native";
import { FONT_SCRIPT, FONT_SERIF, FONT_SERIF_ITALIC } from "@/lib/fonts";

const DEDICATION_PARAGRAPHS = [
  "First and foremost, to God — for always being there for me no matter what, for encouraging me that I am not alone even when at times I thought I was, and for steering me back to the mission He has destined for me.",

  "To my mother, Beverly, who raised me with so much love that it has overflowed into the world — into friendships, relationships, and passions along the way.",

  "To my grandmother, Patricia — one of the holiest and most dedicated women toward our Lord and Savior I have ever met. We went on many journeys, near and far, with her as our captain. She would get me all buttoned up as a wee lad and take me to our Greek Orthodox church, where I enjoyed the services and the people for many years. Though I strayed from the Word, I never lost faith or connection with my Creator. She never stopped reminding me to put God first in all things — it was hard to realize just how important that was as a young man who thought he had it all figured out.",

  "To my father, whose name I share — a man of excellence, for whom showing up and doing the work is just a normal day. Someone I am more like than I ever realized, and wish I could be even more like: a brilliant man who can learn anything better than the experts, and takes pride in all he does. He believes in me so much that he knows I'll figure it out — which is honestly such a great gift, especially when he's instilled in me that you can accomplish anything: figure out the problem, the variables, then the solution. It's that simple. I wonder if that's why I love solving problems so much.",

  "To my stepfather, Steve, who taught me how to be a man and how to be a gentleman — how to swing a hammer, and how not to take life so seriously. “Go with the flow, boy.” I was always called “The Boy,” like Bart from The Simpsons, growing up with all sisters until high school, when my father remarried.",

  "To my other mom, Tracy, who has given me some of the best advice, always filled me with love and hugs, and never once said “I told you so” — no matter how many times she was right. Just a beautiful, kind smile and a little raised eyebrow, like “well, next time maybe listen,” with a kind and soft demeanor, before getting back to whatever she was doing.",

  "To my sister, who I think has probably been one of the greatest shapers of the man I've become — an aspiring gentleman with hopes to spread those qualities to young men around the world.",

  "To my brother, who I had always wanted, and who taught me so many things. With so many different interests, he took me under his wing and showed me the ways of his world with a brotherly kindness — even though we didn't become part of each other's lives until much later.",

  "To my Grandma Betty and Grandpa Fisher, for always keeping me aligned while letting me get away with stuff all at the same time — and for having my family's back when times got tough, helping my mother and us in so many ways.",

  "To Tommy Lamb, my mentor and friend, who taught me to carry myself with pride, to strive for excellence, that it was okay to want perfection, and to hold high values and expectations for those around me — that telling people they can improve, in a kind way, is caring and kindness. He showed me the kind of generosity God speaks about: truly wanting no one to know you helped someone. He would regularly have me help someone in need and want no one to know he had done it — whether it was buying a couple's anniversary meal while we were out, or arranging to repair someone's chipped tooth. He'd be embarrassed if they found out — you could tell he really wanted no recognition. That is the giving without expectation spoken about throughout the Bible. Thank you for leaving this world more beautiful than you found it — through your architecture, the laughs and smiles you put on people's faces, and the hundreds of millions of animals you've helped save, and one day will help save, through the new Humane Society of Tampa, which you spent countless hours designing and fundraising for.",

  "To all the people who believed in me along the way, whose frowns I turned upside down. And to the educators who guided me and were patient with me through the class clowning, the tardiness, and taking over class discussions.",

  "And most especially, to you — for taking the time to read this. I purposely dragged it out, long-story-short style, so I could thank you for taking the time to read it and learn my heart. I hope you'll take a second and think about who you would dedicate an accomplishment to. No matter how big or small, they all matter, and they add up. I am proud of you, and I believe in you.",

  "Remember to put God first. Pray for guidance, remind Him you trust Him, and then remember to trust yourself — that gut feeling is usually right. If you have uncertainty, tell your problem in your own words, what you're struggling with, and let it show you the lessons God shares for how to overcome it. I'll be honest — I didn't realize this book was a key to solving most of life's problems until I was all out of answers, or at least ones that kept leading me back to the same lessons.",

  "Remember, God has your back no matter what. Do the right thing. Treat others the way you would want to be treated. Treat women the way you would want your mother, daughter, or wife to be treated. Be kind to all people — you never know what someone is going through. God puts us all through different tests, and even allows the devil to be quite devious toward a soul to test its faith. So be kind and courteous, and focus on the man or woman in the mirror.",

  "May God bless you and your family, forevermore.",
];

// Dedication + about page.
export default function AboutScreen() {
  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Dedication</Text>
      {DEDICATION_PARAGRAPHS.map((paragraph, i) => (
        <Text key={i} style={[styles.body, i === DEDICATION_PARAGRAPHS.length - 1 && styles.closingLine]}>
          {paragraph}
        </Text>
      ))}

      <Text style={[styles.title, styles.sectionSpacing]}>About Soul Not Solo</Text>
      <Text style={styles.body}>
        Tell it what you're going through — in your own words, typed or spoken — and it finds a
        real passage of Scripture suited to your situation, brings it to life on screen, and lets
        you carry it with you or share it with someone who needs it too. You can also read
        straight through any book of the Bible any time, from the Read tab.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#14100c" },
  content: { padding: 24, paddingBottom: 60 },
  title: { fontFamily: FONT_SCRIPT, fontSize: 40, color: "#d8b46a", marginBottom: 16, textAlign: "center" },
  sectionSpacing: { marginTop: 40 },
  body: { fontFamily: FONT_SERIF, fontSize: 18, lineHeight: 27, color: "#c9bba7", marginBottom: 16 },
  closingLine: { fontFamily: FONT_SERIF_ITALIC, fontSize: 19, textAlign: "center", color: "#d8b46a" },
});
