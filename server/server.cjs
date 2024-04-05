//! JOINROOM ENDPOINT

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  password: String,
  status: String,
  lastActive: { type: Date, default: Date.now },
});
const User = mongoose.model("User", userSchema);

const gameSchema = new mongoose.Schema({
  user1: { type: String, default: null },
  user2: { type: String, default: null },
  user1timestamp: { type: Date, default: null },
  user2timestamp: { type: Date, default: null },
  roomtype: { type: String, default: null },
  user1word: { type: String, default: null },
  user2word: { type: String, default: null },
  user1try: { type: [String], default: null },
  user2try: { type: [String], default: null },
});

const Game = mongoose.model("Game", gameSchema);

mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

app.get("/joinroom", async (req, res) => {
  try {
    const { username, roomtype } = req.query;

    // Find a game room with matching roomtype and at least one user field null
    let game = await Game.findOne({
      roomtype: roomtype,
      $or: [{ user1: null }, { user2: null }],
    });

    if (!game) {
      // If no available room is found, return a message indicating that the room is full
      return res.status(405).json({
        success: false,
        message: "Room is full. Please try again later.",
      });
    }

    // Update the found room with the new user and timestamp
    if (!game.user1) {
      game.user1 = username;
      game.user1timestamp = new Date();
    } else {
      game.user2 = username;
      game.user2timestamp = new Date();
    }
    await game.save();

    res
      .status(200)
      .json({ success: true, message: "Joined room successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.get("/getroom", async (req, res) => {
  try {
    const { username, roomtype } = req.query;
    const game = await Game.findOne({
      roomtype: roomtype,
      $or: [{ user1: username }, { user2: username }],
    });

    if (!game) {
      return res
        .status(404)
        .json({ success: false, message: "Room not found" });
    }
    res.status(200).json({ success: true, room: game });
  } catch (error) {
    console.error("Error occurred while getting room:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.get("/user", async (req, res) => {
  const { name, password } = req.query;

  try {
    const user = await User.findOne({ name, password }).exec();
    if (user) {
      await User.updateOne({ name }, { status: "Online" });
      res.json({ success: true, message: "User found", user });
    } else {
      res.json({ success: false, message: "User not found" });
    }
  } catch (err) {
    console.error("Error querying user:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.get("/user/checkname", async (req, res) => {
  const { name } = req.query;

  try {
    const user = await User.findOne({ name }).exec();
    if (user) {
      res.json({ success: true, message: "User found", user });
    } else {
      res.json({ success: false, message: "User not found" });
    }
  } catch (err) {
    console.error("Error checking user:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Define the route handler for the /getword endpoint
app.get("/getword", async (req, res) => {
  try {
    let { kelime } = req.query;
    kelime = kelime.toLowerCase(); // Convert kelime to lowercase

    // Check if a document with the given word exists in the database
    const wordExists = await Word.exists({ kelime });

    // Return true if the word exists, false otherwise
    res.json({ exists: !!wordExists });
  } catch (error) {
    console.error("Error occurred while checking word existence:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/setenemyword", async (req, res) => {
  try {
    const { username, roomtype, word } = req.body;
    const game = await Game.findOne({
      roomtype: roomtype,
      $or: [{ user1: username }, { user2: username }],
    });

    if (!game) {
      return res
        .status(404)
        .json({ success: false, message: "Room not found" });
    }

    // Determine which user's word to update
    let updatedGame;
    if (game.user1 === username) {
      updatedGame = await Game.findOneAndUpdate(
        { _id: game._id },
        { user2word: word },
        { new: true }
      );
    } else {
      updatedGame = await Game.findOneAndUpdate(
        { _id: game._id },
        { user1word: word },
        { new: true }
      );
    }

    // Return the updated room object in the response
    res.status(200).json({ success: true, room: updatedGame });
  } catch (error) {
    console.error("Error occurred while setting enemy word:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.post("/user", async (req, res) => {
  const { name, password, status } = req.body;

  try {
    const newUser = new User({ name, password, status });

    await newUser.save();

    res.json({ success: true, message: "User added successfully" });
  } catch (err) {
    console.error("Error adding user:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.post("/api/heartbeat", async (req, res) => {
  const { name } = req.body;

  try {
    const user = await User.findOneAndUpdate(
      { name },
      { $set: { lastActive: new Date() } },
      { new: true }
    );

    if (user) {
      res.status(200).send("Last active updated");
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.error("Error updating lastActive:", error);
    res.status(500).send("Internal server error");
  }
});

const checkAndUpdateStatus = async () => {
  try {
    const users = await User.find({ status: { $in: ["Online", "In-game"] } });

    users.forEach(async (user) => {
      if (user.lastActive.getTime() < Date.now() - 15000) {
        await User.findOneAndUpdate(
          { _id: user._id },
          { $set: { status: "Offline" } }
        );
      }
    });
  } catch (error) {
    console.error("Error checking and updating status:", error);
  }
};

setInterval(checkAndUpdateStatus, 16000);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const createRooms = async () => {
  try {
    const roomTypes = ["4letter", "5letter", "6letter", "7letter"];

    // Delete all existing rooms
    await Game.deleteMany({});

    console.log("Existing rooms deleted successfully.");

    for (const roomType of roomTypes) {
      // Create a new game room document
      const newRoom = new Game({
        roomtype: roomType,
      });

      // Save the new room document to the database
      await newRoom.save();
    }

    console.log("Rooms creation process completed.");
  } catch (error) {
    console.error("Error occurred while creating rooms:", error);
  }
};

createRooms();

const turkishWords = [
  "akıl",
  "asma",
  "atış",
  "avlu",
  "ayna",
  "balık",
  "bana",
  "baskı",
  "bata",
  "bayi",
  "bira",
  "boya",
  "buğu",
  "çamaşır",
  "çatlak",
  "cephe",
  "dahi",
  "darı",
  "davul",
  "denge",
  "desen",
  "dikiş",
  "dinç",
  "dolu",
  "duvar",
  "düşü",
  "eğik",
  "ekip",
  "eksi",
  "elma",
  "emir",
  "engel",
  "eşik",
  "evli",
  "fakir",
  "fal",
  "fare",
  "fena",
  "firma",
  "fotoğraf",
  "güç",
  "halk",
  "harf",
  "hava",
  "havlu",
  "heyecan",
  "hobi",
  "içki",
  "ışık",
  "işte",
  "ıslak",
  "ilaç",
  "izin",
  "jandarma",
  "jeton",
  "jüri",
  "kaka",
  "kanal",
  "kapat",
  "kardeş",
  "kasap",
  "kavga",
  "kedi",
  "kelepçe",
  "kemer",
  "kepçe",
  "keramet",
  "kilim",
  "kilit",
  "kırık",
  "kitap",
  "kolay",
  "köpek",
  "köprü",
  "kral",
  "kumaş",
  "kumanda",
  "kurt",
  "kutu",
  "kuşak",
  "kürek",
  "kütük",
  "laf",
  "lamba",
  "limon",
  "madde",
  "mafya",
  "makas",
  "marul",
  "maya",
  "mezar",
  "minik",
  "mısır",
  "mizah",
  "müzik",
  "nakit",
  "nişan",
  "oda",
  "orman",
  "oyun",
  "okul",
  "olta",
  "onay",
  "oscar",
  "otel",
  "oyuncu",
  "ödül",
  "ördek",
  "özel",
  "özür",
  "para",
  "park",
  "pasta",
  "paten",
  "pilot",
  "piyano",
  "polis",
  "posta",
  "porsiyon",
  "profesör",
  "pul",
  "radyo",
  "ramazan",
  "randevu",
  "resim",
  "rüya",
  "sade",
  "sahte",
  "salon",
  "sancak",
  "şahit",
  "şans",
  "şeker",
  "şehir",
  "şerit",
  "şifre",
  "şoför",
  "şöhret",
  "şok",
  "şube",
  "şüphe",
  "süt",
  "sıfır",
  "sıra",
  "sıra dışı",
  "sıra gecesi",
  "sırt",
  "sırt çantası",
  "sırt üstü",
  "taban",
  "tarih",
  "taksi",
  "talih",
  "tamir",
  "tara",
  "tatil",
  "tava",
  "taze",
  "tek",
  "telefon",
  "televizyon",
  "teneke",
  "teori",
  "terapi",
  "teslim",
  "teşvik",
  "tiyatro",
  "toka",
  "toprak",
  "toz",
  "trafik",
  "traktör",
  "tuz",
  "tur",
  "turna",
  "tutku",
  "tünel",
  "tüp",
  "ürün",
  "üstat",
  "üye",
  "üzüm",
  "vade",
  "vali",
  "varlık",
  "vatandaş",
  "vejetaryen",
  "vize",
  "volkan",
  "yaban",
  "yalan",
  "yarış",
  "yatak",
  "yatırım",
  "yavru",
  "yer",
  "yıldırım",
  "yüz",
  "zaman",
  "zincir",
  "abla",
  "açık",
  "açlık",
  "adam",
  "adet",
  "ağıt",
  "akçe",
  "akıl",
  "aktör",
  "alay",
  "alış",
  "altın",
  "altlık",
  "amca",
  "anne",
  "ara",
  "araba",
  "araç",
  "arma",
  "arsa",
  "artı",
  "aşçı",
  "aşk",
  "aşkın",
  "av",
  "ay",
  "ayak",
  "ayna",
  "az",
  "azık",
  "azim",
  "bağ",
  "bakla",
  "bakkal",
  "bal",
  "balık",
  "balon",
  "balya",
  "banyo",
  "bar",
  "barış",
  "basamak",
  "baskı",
  "baslık",
  "baston",
  "batık",
  "batıkent",
  "bay",
  "bayram",
  "bayrak",
  "bey",
  "beyin",
  "beyit",
  "beylik",
  "bıçak",
  "bilet",
  "bina",
  "binici",
  "binlik",
  "bir",
  "bira",
  "bisiklet",
  "bitki",
  "biz",
  "boğa",
  "boğaz",
  "bol",
  "bomba",
  "boncuk",
  "borç",
  "boru",
  "bot",
  "boy",
  "boya",
  "bozuk",
  "böcek",
  "bölge",
  "bölme",
  "bölük",
  "bölüm",
  "bölünme",
  "börek",
  "büro",
  "cami",
  "camişerif",
  "candan",
  "canlı",
  "canlılık",
  "cansız",
  "cansızlık",
  "cem",
  "cemaat",
  "cep",
  "ceza",
  "ciğer",
  "cins",
  "ciyer",
  "ciyak",
  "cız",
  "cızırtı",
  "cıvıltı",
  "çadır",
  "çakmak",
  "çalı",
  "çamaşır",
  "çan",
  "çanta",
  "çap",
  "çapak",
  "çar",
  "çarşı",
  "çatı",
  "çatlak",
  "çavuş",
  "çavuşköy",
  "çay",
  "çayır",
  "çaylak",
  "çaylaklık",
  "çelik",
  "çenek",
  "çeneği",
  "çenik",
  "çeniklik",
  "çerçi",
  "çerçiyoğlu",
  "çerçi bey",
  "çeyrek",
  "çıngır",
  "çıtak",
  "çift",
  "çimen",
  "çınar",
  "çınık",
  "çıplak",
  "çıtçıt",
  "çıtırtı",
  "çıtlık",
  "çıtlıkçı",
  "çıtlıkçılık",
  "çıyan",
  "çökelek",
  "çöken",
  "çöp",
  "çömlek",
  "çöpçü",
  "çöpçülük",
  "çökertme",
  "çökme",
  "çöküş",
  "çözüm",
  "dağ",
  "dalgakıran",
  "dalgıç",
  "dalgın",
  "dalkavuk",
  "dalyan",
  "dam",
  "dambaş",
  "damla",
  "damsız",
  "damsızlık",
  "dar",
  "darağacı",
  "darbe",
  "dare",
  "davet",
  "davranış",
  "dayak",
  "dayanak",
  "deha",
  "değişik",
  "değirmen",
  "değnek",
  "değnekçi",
  "değnekçilik",
  "değnekçioğlu",
  "değnekçioğlu",
  "dem",
  "demet",
  "demir",
  "deniz",
  "denizaltı",
  "denizanı",
  "denizaltı",
  "denizcilik",
  "denizci",
  "denizyıldızı",
  "deprem",
  "deve",
  "devlet",
  "devletleme",
  "devletlemeçi",
  "devletlemeçilik",
  "devlet malı",
  "devlet malıyla",
  "devletli",
  "devletsiz",
  "devletçi",
  "devletçilik",
  "devir",
  "devletüstü",
  "dev",
  "diken",
  "dikeni",
  "dikenli",
  "dikenlilik",
  "dikensiz",
  "dikensizlik",
  "diket",
  "dikkat",
  "dilek",
  "din",
  "dinci",
  "dindar",
  "dinsiz",
  "dip",
  "direk",
  "diri",
  "dirim",
  "dizi",
  "dizmek",
  "dizüstü",
  "doku",
  "dolaşma",
  "dolma",
  "dolu",
  "doluluk",
  "domuz",
  "dökmeci",
  "dökmecilik",
  "dökme",
  "dönemeç",
  "döner",
  "dönme",
  "dönüş",
  "düş",
  "düşü",
  "düşüş",
  "ebe",
  "ecza",
  "edebiyat",
  "edebi",
  "edebiyatçı",
  "edebiyatçılık",
  "edep",
  "edik",
  "eğik",
  "eğim",
  "eğirme",
  "eğilim",
  "eğirme",
  "eğik",
  "eğitim",
  "eğitimci",
  "eğitimcilik",
  "eğreti",
  "eğilme",
  "eğim",
  "eğlence",
  "eğlence",
  "eğlenceci",
  "eğlenceli",
  "eğlenme",
  "eğme",
  "eğreltiotu",
  "eğri",
  "eğreti",
  "eğretileme",
  "eğretileşme",
  "eğretileşme",
  "eğretileştirme",
  "eğretileştirilme",
  "eğreti",
  "eğretileşme",
  "eğretileştirme",
  "eğretileştirilme",
  "eğreti",
  "eğretileşme",
  "eğretileştirme",
  "eğretileştirilme",
  "eğreti",
  "eğretileşme",
  "eğretileştirme",
];

// Kelime şemasını tanımla
const wordSchema = new mongoose.Schema({
  kelime: String,
});

// Kelime modelini oluştur
const Word = mongoose.model("Word", wordSchema);

// Kelimeleri kaydeden fonksiyon
async function saveWordsToMongoDB(words) {
  try {
    // Kelimeleri tek bir dökümana dönüştür
    const wordsDocument = words.map((word) => ({ kelime: word }));

    // Kelimeleri toplu olarak MongoDB'ye kaydet
    await Word.insertMany(wordsDocument);

    console.log("Kelimeler başarıyla MongoDB'ye kaydedildi.");
  } catch (error) {
    console.error(
      "Kelimeleri MongoDB'ye kaydetme sırasında bir hata oluştu:",
      error
    );
  }
}

//saveWordsToMongoDB(turkishWords);
