
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { formatCurrency } from "@/app/lib/utils";

type Charity = {
  legalName: string;
  registrationNo: string;
  address: string;
  city: string;
  province: string;
  postal: string;
  locationIssued: string;
  authorizedSigner: string;
};

type Donor = {
  name_official: string;
  address: string | null;
  city: string | null;
  province: string | null;
  postal: string | null;
};

type DonationLine = {
  date: string; // YYYY-MM-DD
  amountCents: number;
};

type Props = {
  taxYear: number;
  serialNumber: number;
  issueDateISO: string; // YYYY-MM-DD
  charity: Charity;
  donor: Donor;
  totalCents: number;
  lines: DonationLine[]; // optional but nice for annual summary
};

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11 },
  title: { fontSize: 16, marginBottom: 10, fontWeight: 700 as any },
  subtitle: { marginBottom: 10 },
  section: { marginTop: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  box: { borderWidth: 1, borderColor: "#999", padding: 10, borderRadius: 4 },
  label: { color: "#555", marginBottom: 3 },
  value: { fontSize: 11 },
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#999", paddingBottom: 4, marginTop: 6 },
  tableRow: { flexDirection: "row", paddingVertical: 3, borderBottomWidth: 0.5, borderColor: "#ddd" },
  colDate: { width: "40%" },
  colAmt: { width: "60%", textAlign: "right" as any },
  small: { fontSize: 9, color: "#666" },
});

export type ReceiptDocumentProps = Props;

const ReceiptDocument = (props: Props) => {
  const { taxYear, serialNumber, issueDateISO, charity, donor, totalCents, lines } = props;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>Official donation receipt for income tax purposes</Text>
        <Text style={styles.subtitle}>(Canada Revenue Agency requirements)</Text>

        <View style={[styles.box, styles.section]}>
          <View style={styles.row}>
            <View>
              <Text style={styles.label}>Charity (as registered)</Text>
              <Text style={styles.value}>{charity.legalName}</Text>
              <Text style={styles.value}>
                {charity.address}, {charity.city}, {charity.province} {charity.postal}
              </Text>
              <Text style={styles.value}>Registration number: {charity.registrationNo}</Text>
              <Text style={styles.value}>Location issued: {charity.locationIssued}</Text>
            </View>

            <View>
              <Text style={styles.label}>Receipt details</Text>
              <Text style={styles.value}>Tax year: {taxYear}</Text>
              <Text style={styles.value}>Serial number: {serialNumber}</Text>
              <Text style={styles.value}>Issue date: {issueDateISO}</Text>
              <Text style={styles.value}>Date gift received: {taxYear}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.box, styles.section]}>
          <Text style={styles.label}>Donor</Text>
          <Text style={styles.value}>{donor.name_official}</Text>
          <Text style={styles.value}>
            {[donor.address, donor.city, donor.province, donor.postal].filter(Boolean).join(", ") || "—"}
          </Text>
        </View>

        <View style={[styles.box, styles.section]}>
          <View style={styles.row}>
            <View>
              <Text style={styles.label}>Amount of gift</Text>
              <Text style={styles.value}>{formatCurrency(totalCents)}</Text>
            </View>
            <View>
              <Text style={styles.label}>Eligible amount</Text>
              <Text style={styles.value}>{formatCurrency(totalCents)}</Text>
            </View>
          </View>

          <Text style={[styles.small, { marginTop: 6 }]}>
            Note: If advantages/benefits apply (split receipting), eligible amount must be reduced accordingly.
          </Text>
        </View>

        {!!lines?.length && (
          <View style={styles.section}>
            <Text style={styles.label}>Donations included (summary)</Text>

            <View style={styles.tableHeader}>
              <Text style={styles.colDate}>Date</Text>
              <Text style={styles.colAmt}>Amount</Text>
            </View>

            {lines.map((l, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={styles.colDate}>{l.date}</Text>
                <Text style={styles.colAmt}>{formatCurrency(l.amountCents)}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>Authorized signature</Text>
          <Text style={styles.value}>{charity.authorizedSigner}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.small}>
            CRA website: canada.ca/charities-giving
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export default ReceiptDocument;