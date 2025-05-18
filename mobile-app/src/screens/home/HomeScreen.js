import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../utils/theme';
import Header from '../../components/Header';
import ProductCard from '../../components/ProductCard';
import { products as productService } from '../../services/supabaseClient';

const categories = [
  { id: 'all', name: 'All' },
  { id: 'milk', name: 'Milk' },
  { id: 'cream', name: 'Cream' },
];

const HomeScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = async () => {
    try {
      const { data, error } = await productService.getAll();
      if (error) throw error;
      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    filterProducts(text, selectedCategory);
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    filterProducts(searchQuery, categoryId);
  };

  const filterProducts = (query, category) => {
    let filtered = products;
    
    // Filter by search query
    if (query) {
      const lowercasedQuery = query.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(lowercasedQuery) ||
        product.description?.toLowerCase().includes(lowercasedQuery)
      );
    }
    
    // Filter by category
    if (category !== 'all') {
      filtered = filtered.filter(product => product.category === category);
    }
    
    setFilteredProducts(filtered);
  };

  const handleProductPress = (product) => {
    navigation.navigate('ProductDetails', { productId: product.id });
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item.id && styles.selectedCategoryItem,
      ]}
      onPress={() => handleCategorySelect(item.id)}
    >
      <Text
        style={[
          styles.categoryText,
          selectedCategory === item.id && styles.selectedCategoryText,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderProductItem = ({ item }) => (
    <ProductCard product={item} onPress={handleProductPress} />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading products...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Lasso Dairy"
        rightIcon="cart-outline"
        onRightPress={() => navigation.navigate('Cart')}
      />
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={COLORS.gray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor={COLORS.gray}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="basket" size={60} color={COLORS.lightGray} />
          <Text style={styles.emptyText}>No products found</Text>
          <Text style={styles.emptySubtext}>Try a different search or category</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.productsRow}
          contentContainerStyle={styles.productsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: SIZES.body3,
    color: COLORS.gray,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 12,
    ...SHADOWS.light,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: SIZES.body3,
    color: COLORS.textDark,
  },
  categoriesContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 6,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
  },
  selectedCategoryItem: {
    backgroundColor: COLORS.primary,
  },
  categoryText: {
    fontSize: SIZES.body4,
    ...FONTS.medium,
    color: COLORS.textDark,
  },
  selectedCategoryText: {
    color: COLORS.white,
  },
  productsRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  productsList: {
    paddingTop: 16,
    paddingBottom: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: SIZES.h2,
    ...FONTS.bold,
    color: COLORS.textDark,
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: SIZES.body3,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default HomeScreen;
