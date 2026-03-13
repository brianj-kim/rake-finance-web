
/* eslint-disable jsx-a11y/alt-text */
import {
  Document,
  Image,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import path from 'path';
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
  charityEmail: string | null;
  charityPhone: string | null;
  charityWebsite: string | null;
  churchLogoUrl: string | null;
  authorizedSignatureUrl: string | null;
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
  logoWrap: { alignItems: 'flex-end', marginBottom: 8 },
  logo: { maxWidth: 120, maxHeight: 60, objectFit: 'contain' },
  title: { fontSize: 16, marginBottom: 10, fontWeight: 700 },
  subtitle: { marginBottom: 10 },
  section: { marginTop: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  box: { borderWidth: 1, borderColor: "#999", padding: 10, borderRadius: 4 },
  label: { color: "#555", marginBottom: 3 },
  value: { fontSize: 11 },
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#999", paddingBottom: 4, marginTop: 6 },
  tableRow: { flexDirection: "row", paddingVertical: 3, borderBottomWidth: 0.5, borderColor: "#ddd" },
  colDate: { width: "40%" },
  colAmt: { width: "60%", textAlign: "right" },
  small: { fontSize: 9, color: "#666" },
  signatureImage: { width: 140, height: 48, objectFit: 'contain', marginBottom: 4 },
});

const resolveImageSrc = (value: string | null | undefined): string | undefined => {
  if (!value || typeof value !== 'string') return undefined;
  const normalized = value.trim();
  if (!normalized) return undefined;

  if (normalized.startsWith('data:image/')) return normalized;
  if (/^https?:\/\//i.test(normalized)) return normalized;
  if (normalized.startsWith('/')) {
    const relative = normalized.replace(/^\/+/, '');
    return path.join(process.cwd(), 'public', relative);
  }

  return undefined;
};

export type ReceiptDocumentProps = Props;

const ReceiptDocument = (props: Props) => {
  const { taxYear, serialNumber, issueDateISO, charity, donor, totalCents, lines } = props;
  const logoSrc = resolveImageSrc(charity.churchLogoUrl);
  const signatureSrc = resolveImageSrc(charity.authorizedSignatureUrl);
  const charityContacts = [charity.charityEmail, charity.charityPhone, charity.charityWebsite]
    .filter((v): v is string => Boolean(v?.trim()))
    .join(' | ');

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {logoSrc ? (
          <View style={styles.logoWrap}>
            <Image src={logoSrc} style={styles.logo} />
          </View>
        ) : null}
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
              {charityContacts ? <Text style={styles.value}>Contact: {charityContacts}</Text> : null}
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
          {signatureSrc ? <Image src={signatureSrc} style={styles.signatureImage} /> : null}
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
