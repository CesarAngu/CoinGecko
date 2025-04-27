import React, { useEffect, useState, createContext, useContext, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  TextInput,
  Alert,
  Button,
  Share,
  TouchableOpacity,
} from "react-native";
import { NavigationContainer, useFocusEffect } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import LoginScreen from "./components/LoginScreen";

const ThemeContext = createContext();

function useTheme() {
  return useContext(ThemeContext);
}

function HomeScreen() {
  const [coins, setCoins] = useState([]);
  const [filteredCoins, setFilteredCoins] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [randomCoin, setRandomCoin] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [sortAscending, setSortAscending] = useState(true);
  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    axios
      .get("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd")
      .then((response) => {
        setCoins(response.data);
        setFilteredCoins(response.data);
        setLoading(false);
        loadFavorites();
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setLoading(false);
      });
    Alert.alert("CoinDay", "Revisa las criptos del día 🪙");
  }, []);

  const handleSearch = (text) => {
    setSearchText(text);
    const filtered = coins.filter((coin) =>
      coin.name.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredCoins(filtered);
  };

  const pickRandomCoin = () => {
    if (filteredCoins.length > 0) {
      const index = Math.floor(Math.random() * filteredCoins.length);
      setRandomCoin(filteredCoins[index]);
    }
  };

  const toggleFavorite = async (coin) => {
    let updatedFavorites;
    const exists = favorites.find((fav) => fav.id === coin.id);
    if (exists) {
      updatedFavorites = favorites.filter((fav) => fav.id !== coin.id);
    } else {
      updatedFavorites = [...favorites, coin];
    }
    setFavorites(updatedFavorites);
    await AsyncStorage.setItem("favorites", JSON.stringify(updatedFavorites));
  };

  const loadFavorites = async () => {
    const stored = await AsyncStorage.getItem("favorites");
    if (stored) {
      setFavorites(JSON.parse(stored));
    }
  };

  const isFavorite = (coin) => favorites.some((fav) => fav.id === coin.id);

  const toggleSortOrder = () => {
    const sorted = [...filteredCoins].sort((a, b) => {
      if (sortAscending) {
        return a.current_price - b.current_price;
      } else {
        return b.current_price - a.current_price;
      }
    });
    setFilteredCoins(sorted);
    setSortAscending(!sortAscending);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#000" />
        <Text>Cargando criptos...</Text>
      </View>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: isDarkMode ? "#121212" : "#ffffff" }}>
      <TextInput
        style={{
          height: 40,
          borderColor: "gray",
          borderWidth: 1,
          margin: 10,
          paddingHorizontal: 10,
          borderRadius: 5,
          color: isDarkMode ? "#fff" : "#000",
          backgroundColor: isDarkMode ? "#333" : "#fff",
        }}
        placeholder="Buscar criptomoneda..."
        placeholderTextColor={isDarkMode ? "#ccc" : "#888"}
        value={searchText}
        onChangeText={handleSearch}
      />
      
      <TouchableOpacity
        onPress={toggleSortOrder}
        style={{
          backgroundColor: "#8E44AD",
          padding: 10,
          marginHorizontal: 20,
          borderRadius: 10,
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>
          {sortAscending ? "⬇️ Ordenar Mayor Precio" : "⬆️ Ordenar Menor Precio"}
        </Text>
      </TouchableOpacity>

      <FlatList
        data={filteredCoins}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 10,
              borderBottomWidth: 1,
              borderColor: "#ccc",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image
                source={{ uri: item.image }}
                style={{ width: 40, height: 40, marginRight: 10 }}
              />
              <View>
                <Text style={{ fontWeight: "bold", color: isDarkMode ? "#fff" : "#000" }}>
                  {item.name}
                </Text>
                <Text style={{ color: isDarkMode ? "#ccc" : "#000" }}>
                  ${item.current_price.toLocaleString()}
                </Text>
              </View>
            </View>
            <Text
              onPress={() => toggleFavorite(item)}
              style={{ fontSize: 20, color: isFavorite(item) ? "gold" : "gray" }}
            >
              ⭐
            </Text>
          </View>
        )}
      />
    </View>
  );
}

function FavoritesScreen() {
  const [favorites, setFavorites] = useState([]);
  const { isDarkMode } = useTheme();

  const loadFavorites = async () => {
    const stored = await AsyncStorage.getItem("favorites");
    if (stored) {
      setFavorites(JSON.parse(stored));
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const removeFavorite = async (coinId) => {
    const updated = favorites.filter((fav) => fav.id !== coinId);
    setFavorites(updated);
    await AsyncStorage.setItem("favorites", JSON.stringify(updated));
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDarkMode ? "#121212" : "#ffffff" }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", textAlign: "center", marginVertical: 20, color: isDarkMode ? "#fff" : "#000" }}>
        ⭐ Mis Criptomonedas Favoritas
      </Text>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ flexDirection: "row", alignItems: "center", padding: 10, borderBottomWidth: 1, borderColor: "#ccc", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image source={{ uri: item.image }} style={{ width: 40, height: 40, marginRight: 10 }} />
              <View>
                <Text style={{ fontWeight: "bold", color: isDarkMode ? "#fff" : "#000" }}>{item.name}</Text>
                <Text style={{ color: isDarkMode ? "#ccc" : "#000" }}>${item.current_price.toLocaleString()}</Text>
              </View>
            </View>
            <Text onPress={() => removeFavorite(item.id)} style={{ fontSize: 20, color: "red" }}>
              ❌
            </Text>
          </View>
        )}
      />
    </View>
  );
}

function FraseScreen() {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isDarkMode } = useTheme();

  const fetchQuote = async () => {
    try {
      setLoading(true);
      const res = await axios.get("https://frasedeldia.azurewebsites.net/api/phrase");
      setQuote(res.data);
    } catch (err) {
      setQuote({ quote: "Error al obtener la frase", author: "🙏" });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!quote) return;
    try {
      await Share.share({ message: `"${quote.quote}" - ${quote.author}` });
    } catch (error) {
      Alert.alert("Error", "No se pudo compartir la frase.");
    }
  };

  useEffect(() => {
    fetchQuote();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: isDarkMode ? "#121212" : "#fff" }}>
      {loading ? (
        <ActivityIndicator size="large" color={isDarkMode ? "#fff" : "#000"} />
      ) : (
        <View style={{ backgroundColor: isDarkMode ? "#333" : "#eee", padding: 20, borderRadius: 10, alignItems: "center" }}>
          <Text style={{ fontSize: 18, fontStyle: "italic", marginBottom: 10, color: isDarkMode ? "#fff" : "#000" }}>
            "{quote.quote}"
          </Text>
          <Text style={{ fontWeight: "bold", color: isDarkMode ? "#ccc" : "#000" }}>
            - {quote.author}
          </Text>
        </View>
      )}
      <View style={{ marginTop: 20 }}>
        <Button title="🧠 Otra Frase" onPress={fetchQuote} color={isDarkMode ? "#888" : "#007AFF"} />
      </View>
      <View style={{ marginTop: 10 }}>
        <Button title="📤 Compartir frase" onPress={handleShare} color="#4CAF50" />
      </View>
    </View>
  );
}

const Tab = createBottomTabNavigator();

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <NavigationContainer>
        <Tab.Navigator>
          <Tab.Screen name="Inicio" component={HomeScreen} />
          <Tab.Screen name="Favoritos" component={FavoritesScreen} />
          <Tab.Screen name="Login" component={LoginScreen} />
          <Tab.Screen name="Frase" component={FraseScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </ThemeContext.Provider>
  );
}