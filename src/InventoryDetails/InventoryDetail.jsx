/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { Card, Typography } from "antd";
import { useParams } from "react-router-dom";
import { BoxIcon } from "lucide-react";
import api from "../api/apifor";
import styles from "./inventoryDetail.module.scss";

const { Title } = Typography;

const InventoryDetail = () => {
  const { id } = useParams();
  const [inventoryData, setInventoryData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        const response = await api.get(`v1/inventory/${id}`);
        setInventoryData(response.data);
      } catch (error) {
        console.error("Error fetching inventory data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInventoryData();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!inventoryData) return <div>No data found</div>;

  return (
    <div className={styles.inventoryPage}>
      <>
        <Card className={styles.detailCard}>
          <div className={styles.statusContainer}>
            <span
              className={`${styles.statusTag} ${
                inventoryData.status === "true"
                  ? styles.available
                  : styles.notAvailable
              }`}
            >
              {inventoryData.status === "true" ? "false" : "Not available"}
            </span>
          </div>
          <div className={styles.priceDetails}>
            <div className={styles.priceItem}>
              <span className={styles.label}> inventory_price</span>
              {/* <span className={styles.value}>${inventoryData.price_of_one}</span> */}
              <input
                type="text"
                name="first_name"
                placeholder="First name"
                value={inventoryData.price_of_one}
              />
            </div>
            <div className={styles.priceItem}>
              <span className={styles.label}> inventory_quantity</span>
              {/* <span className={styles.value}>{inventoryData.count}</span> */}
              <input
                type="text"
                name="count"
                placeholder="count"
                value={inventoryData.count}
              />
            </div>
            <div className={styles.priceItem}>
              <span className={styles.label}> sum_price</span>
              {/* <span className={styles.value}>${inventoryData.price_of_sum}</span> */}
              <input
                type="text"
                name="price_of_sume"
                placeholder="price_of_sum"
                value={inventoryData.price_of_sum}
              />
            </div>
          </div>
          <div className={styles.timestamps}>
            <div className={styles.timestampItem}>
              <span className={styles.label}> created_at</span>
              {/* <span className={styles.value}>
                  {new Date(inventoryData.created_at).toLocaleDateString()}
                </span> */}
              <input
                type="text"
                name="created_at"
                placeholder="First name"
                value={inventoryData.created_at}
              />
            </div>
            <div className={styles.timestampItem}>
              <span className={styles.label}> updated_at</span>
              {/* <span className={styles.value}>
                  {new Date(inventoryData.updated_at).toLocaleDateString()}
                </span> */}
              <input
                type="text"
                name="updated_at"
                placeholder="updated_at"
                value={inventoryData.updated_at}
              />
            </div>
          </div>
        </Card>
      </>
      <>
        <Card className={styles.employeeCard}>
          {inventoryData.employees && inventoryData.employees.length > 0 ? (
            <div className={styles.employeeList}>
              {inventoryData.employees.map((employee) => (
                <div key={employee.id} className={styles.employeeItem}>
                  <span className={styles.employeeName}>
                    {`${employee.employee.first_name} ${employee.employee.last_name}`}
                  </span>
                  <span className={styles.quantity}>{employee.quantity}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <BoxIcon size={24} />
              <p> There is no any assigned employee</p>
            </div>
          )}
        </Card>
      </>
    </div>
  );
};

export default InventoryDetail;
