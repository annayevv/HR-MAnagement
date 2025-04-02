import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/apifor";
import styles from "./inventoryManager.module.scss";
import { Button, Modal, Input, Popconfirm, message } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  StopOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import InfiniteScroll from "react-infinite-scroll-component";
import { useLanguage } from "../Language/LanguageContext";
import translations from "../Language/translation";

const InventoryManager = () => {
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("");
    const { language } = useLanguage();
    const t = translations[language];
  const [productPrice, setProductPrice] = useState("");
  const [user_id, setUserId] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [errors, setErrors] = useState({});
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [editProductId, setEditProductId] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const itemsPerPage = 20; // Set the limit to 20 items per fetch
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const showModal = () => {
    setOpen(true);
  };

  const fetchInventory = async (pageNum, shouldReset = false) => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      const response = await api.get(
        `v1/inventory?page=${pageNum}&limit=${itemsPerPage}`
      );

      if (response.data && Array.isArray(response.data.rows)) {
        if (shouldReset) {
          setInventory(response.data.rows);
        } else {
          setInventory((prevInventory) => {
            const newProducts = response.data.rows.filter(
              (newProduct) =>
                !prevInventory.some(
                  (existingProduct) => existingProduct.id === newProduct.id
                )
            );
            return [...prevInventory, ...newProducts];
          });
        }

        setHasMore(response.data.rows.length === itemsPerPage);
      }
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
      message.error("Failed to load inventory");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory(0, true);
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!productName.trim()) newErrors.productName = "Product name is required";
    if (!quantity.trim()) newErrors.quantity = "Quantity is required";
    if (!productPrice.trim()) {
      newErrors.productPrice = "Product price is required";
    } else if (!/^\d+(\.\d{1,2})?$/.test(productPrice.trim())) {
      newErrors.productPrice =
        "Price should be a valid number (e.g., 30000 or 30000.99)";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddProduct = async () => {
    if (validateForm()) {
      const cleanProductPrice = productPrice.trim();
      const newProduct = {
        name: productName,
        count: parseInt(quantity, 10),
        price_of_one: parseFloat(cleanProductPrice),
        user_id: null,
      };
      try {
        await api.post("v1/inventory", newProduct);
        setProductName("");
        setQuantity("");
        setProductPrice("");
        setUserId(null);
        setErrors({});
        setOpen(false);
        resetForm();
        setOpen(false);
        setPage(0);
        await fetchInventory(0, true);
        message.success("Product added successfully");
      } catch (error) {
        console.error("Failed to add product:", error);
        message.error("Failed to add product");
      }
    } else {
      console.log("Form validation failed", errors);
    }
  };

  const handleEditProduct = async (productId, updatedProduct) => {
    try {
      const validatedProduct = {
        ...updatedProduct,
        count: parseInt(updatedProduct.count, 10),
        price_of_one: parseFloat(updatedProduct.price_of_one),
      };
      await api.put(`v1/inventory/${productId}`, validatedProduct);
      resetForm();
      setOpen(false);
      setPage(0);
      await fetchInventory(0, true);
      message.success("Product updated successfully");
      resetEditState();
    } catch (error) {
      console.error("Failed to update product:", error);
      message.error("Failed to update product");
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await api.delete(`v1/inventory/${productId}/`);
      setPage(0);
      await fetchInventory(0, true);
      message.success("The product was successfully deleted.");
    } catch (error) {
      console.error("Failed to delete product:", error);
      message.error({
        message:
          "Delete Failed. Inventory may be in use. Please remove from employee and try again.",
      });
    }
  };

  const handleOk = async () => {
    setConfirmLoading(true);
    await handleAddProduct();
    setConfirmLoading(false);
  };

  const handleCancel = () => {
    setOpen(false);
    setProductName("");
    setQuantity("");
    setProductPrice("");
    setUserId(null);
    setErrors({});
  };

  const resetEditState = () => {
    setEditProductId(null);
    setProductName("");
    setQuantity("");
    setProductPrice("");
    setUserId(null);
    setErrors({});
  };

  const fetchMoreData = () => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchInventory(nextPage);
    }
  };
  const resetForm = () => {
    setProductName("");
    setQuantity("");
    setProductPrice("");
    setUserId(null);
    setErrors({});
  };
  const handleViewInventory = (productId) => {
    navigate(`/oraz/inventory-detail/${productId}`);
  };

  return (
    <div className={styles.managerPage}>
      <header className={styles.header}></header>
      <Button
        onClick={showModal}
        style={{ backgroundColor: "#2A2A2A", border: "none", color: "#fff" }}
      >
        {t.inventAddNew}
      </Button>

      <Modal
        open={open}
        onOk={handleOk}
        confirmLoading={confirmLoading}
        onCancel={handleCancel}
        className={styles.customModal}
      >
        <div className={styles.formGroup}>
          <label> {t.inventName}</label>
          <Input
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
          />
          {errors.productName && (
            <p className={styles.error}>{errors.productName}</p>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div className={styles.formGroup}>
            <label>product_quantity:</label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            {errors.quantity && (
              <p className={styles.error}>{errors.quantity}</p>
            )}
          </div>
          <div className={styles.formGroup}>
            <label>product_price:</label>
            <Input
              value={productPrice}
              type="number"
              onChange={(e) => setProductPrice(e.target.value)}
            />
            {errors.productPrice && (
              <p className={styles.error}>{errors.productPrice}</p>
            )}
          </div>
        </div>
      </Modal>

      <InfiniteScroll
        dataLength={inventory.length}
        style={{ overflow: "hidden" }}
        next={fetchMoreData}
        hasMore={hasMore}
        loader={<h4>Loading...</h4>}
        endMessage={<p style={{ textAlign: "center" }}>No more products</p>}
      >
        <table className={styles.inventoryTable}>
          <thead>
            <tr>
              <th>{t.inventName}</th>
              <th>{t.inventQuant}</th>
              <th>{t.inventproductPrice}</th>
              <th>{t.inventallPrice}</th>
              <th>{t.userActions}</th>
            </tr>
          </thead>
          <tbody>
            {inventory.length > 0 ? (
              inventory.map((product, index) => (
                <tr key={product.id}>
                  <td>
                    {editProductId === product.id ? (
                      <Input
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                      />
                    ) : (
                      product.name
                    )}
                  </td>
                  <td>
                    {editProductId === product.id ? (
                      <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                      />
                    ) : (
                      product.count
                    )}
                  </td>
                  <td>
                    {editProductId === product.id ? (
                      <Input
                        type="number"
                        value={productPrice}
                        onChange={(e) => setProductPrice(e.target.value)}
                      />
                    ) : (
                      product.price_of_one
                    )}
                  </td>
                  <td>
                    {product.price_of_sum
                      ? product.price_of_sum
                      : "Not available"}
                  </td>
                  <td style={{ display: "flex", gap: "15px" }}>
                    {editProductId === product.id ? (
                      <>
                        <Button
                          className={styles.actionButton}
                          icon={<EditOutlined />}
                          onClick={() =>
                            handleEditProduct(product.id, {
                              name: productName,
                              count: quantity,
                              price_of_one: productPrice,
                            })
                          }
                        >
                          {/* {t("save")} */}
                        </Button>
                        <Button
                          icon={<StopOutlined style={{ color: "#fff" }} />}
                          onClick={() => {
                            resetEditState();
                          }}
                          style={{
                            marginLeft: "10px",
                            borderColor: "#fff",
                            color: "#fff",
                          }}
                          className={styles.actionButton}
                        >
                          {/* {t("cancel")} */}
                        </Button>
                      </>
                    ) : (
                      <Button
                        className={styles.actionButton}
                        icon={<EditOutlined style={{ color: "#fff" }} />}
                        onClick={() => {
                          setProductName(product.name);
                          setQuantity(product.count);
                          setProductPrice(product.price_of_one);
                          setEditProductId(product.id);
                        }}
                      >
                        {/* Edit */}
                      </Button>
                    )}
                    <Popconfirm
                      title="Are you sure you want to delete this product?"
                      onConfirm={() => handleDeleteProduct(product.id)}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button
                        className={styles.actionButton} 
                        icon={<DeleteOutlined color="red" />}
                        danger
                      >
                        {/* Delete */}
                      </Button>
                    </Popconfirm>
                    <Button
                      className={styles.actionButton}
                      icon={<EyeOutlined style={{ color: "#fff" }} />}
                      onClick={() => handleViewInventory(product.id)}
                    >
                      {/* View Inventory */}
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7"> No products available</td>
              </tr>
            )}
          </tbody>
        </table>
      </InfiniteScroll>
    </div>
  );
};

export default InventoryManager;
