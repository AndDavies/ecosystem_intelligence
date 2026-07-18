import React from "react";
import { Document, Link, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { assessmentConfidenceLabel, evidenceStrengthLabel, locationAccuracyLabel } from "@/lib/atlas/presentation";
import type { AtlasCapability, AtlasOrganization } from "@/types/atlas";

const colors = {
  navy: "#101828",
  blue: "#0756D9",
  slate: "#475467",
  muted: "#667085",
  line: "#D0D5DD",
  paleBlue: "#EFF6FF",
  paleAmber: "#FFFAEB",
  amber: "#7A2E0E",
  white: "#FFFFFF"
};

const styles = StyleSheet.create({
  page: { paddingTop: 34, paddingBottom: 42, paddingHorizontal: 38, fontFamily: "Helvetica", color: colors.navy, fontSize: 9.5, lineHeight: 1.45 },
  brand: { color: colors.blue, fontSize: 8, fontFamily: "Helvetica-Bold", letterSpacing: 1.1, textTransform: "uppercase" },
  title: { marginTop: 8, fontSize: 24, lineHeight: 1.12, fontFamily: "Helvetica-Bold" },
  description: { marginTop: 9, color: colors.slate, fontSize: 10.5, lineHeight: 1.55 },
  divider: { marginVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.line },
  grid: { flexDirection: "row", gap: 14 },
  main: { width: "65%" },
  rail: { width: "35%" },
  section: { marginBottom: 12 },
  sectionTitle: { marginBottom: 7, color: colors.navy, fontSize: 11, fontFamily: "Helvetica-Bold" },
  eyebrow: { marginBottom: 3, color: colors.blue, fontSize: 7, fontFamily: "Helvetica-Bold", letterSpacing: 0.9, textTransform: "uppercase" },
  card: { borderWidth: 1, borderColor: colors.line, borderRadius: 3, padding: 11, marginBottom: 9 },
  paleCard: { borderWidth: 1, borderColor: colors.line, borderRadius: 3, padding: 10, marginBottom: 8, backgroundColor: "#F8FAFC" },
  derivedCard: { borderWidth: 1, borderColor: "#FEDF89", borderRadius: 3, padding: 8, marginBottom: 6, backgroundColor: colors.paleAmber, color: colors.amber },
  capabilityTitle: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  meta: { marginTop: 2, color: colors.muted, fontSize: 8.5 },
  body: { marginTop: 6, color: colors.slate },
  label: { marginTop: 8, marginBottom: 3, color: colors.muted, fontSize: 7, fontFamily: "Helvetica-Bold", letterSpacing: 0.6, textTransform: "uppercase" },
  bullet: { flexDirection: "row", gap: 5, marginTop: 2.5 },
  bulletMark: { color: colors.blue, width: 7 },
  bulletText: { flex: 1, color: colors.slate },
  sourceLink: { color: colors.blue, textDecoration: "none", fontFamily: "Helvetica-Bold", fontSize: 8.5 },
  sourceMeta: { marginTop: 1, color: colors.muted, fontSize: 7.5 },
  profileRow: { paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: "#EAECF0" },
  profileLabel: { color: colors.muted, fontSize: 7 },
  profileValue: { marginTop: 2, color: colors.navy, fontFamily: "Helvetica-Bold", fontSize: 8.5 },
  caveat: { marginTop: 8, padding: 8, borderRadius: 3, backgroundColor: colors.paleBlue, color: colors.slate, fontSize: 7.5 },
  footer: { position: "absolute", bottom: 20, left: 38, right: 38, flexDirection: "row", justifyContent: "space-between", color: colors.muted, fontSize: 7 }
});

function Footer() {
  return (
    <View style={styles.footer} fixed>
      <Text>True North Map · Public sources only</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

function BulletList({ values }: { values: string[] }) {
  return (
    <View>
      {values.map((value) => (
        <View key={value} style={styles.bullet} wrap={false}>
          <Text style={styles.bulletMark}>•</Text>
          <Text style={styles.bulletText}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

function Sources({ organization, capability }: { organization: AtlasOrganization; capability?: AtlasCapability }) {
  const citations = [
    ...organization.citations,
    ...(capability?.citations ?? []),
    ...(capability?.missionMatches.flatMap((match) => match.citations) ?? []),
    ...(capability?.demandMatches.flatMap((match) => match.citations) ?? [])
  ];
  const unique = Array.from(new Map(citations.map((citation) => [citation.sourceUrl, citation])).values());

  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.eyebrow}>Sources</Text>
      <Text style={styles.sectionTitle}>{unique.length} public {unique.length === 1 ? "source" : "sources"}</Text>
      {unique.map((citation) => (
        <View key={citation.id} style={{ marginBottom: 7 }} wrap={false}>
          <Link src={citation.sourceUrl} style={styles.sourceLink}>{citation.sourceTitle}</Link>
          <Text style={styles.sourceMeta}>{citation.publisher} · {citation.sourceType.replaceAll("_", " ")}</Text>
        </View>
      ))}
    </View>
  );
}

function OrganizationPdf({ organization }: { organization: AtlasOrganization }) {
  return (
    <Document title={`${organization.name} public profile`} author="True North Map">
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.brand}>True North Map / Public Atlas</Text>
        <Text style={styles.title}>{organization.name}</Text>
        <Text style={styles.description}>{organization.description}</Text>
        <View style={styles.divider} />

        <View style={styles.grid}>
          <View style={styles.main}>
            <View style={styles.section}>
              <Text style={styles.eyebrow}>Verified capabilities</Text>
              <Text style={styles.sectionTitle}>Capabilities</Text>
              {organization.capabilities.map((capability) => (
                <View key={capability.id} style={styles.card} wrap={false}>
                  <Text style={styles.capabilityTitle}>{capability.name}</Text>
                  {capability.capabilityType ? <Text style={styles.meta}>{capability.capabilityType}</Text> : null}
                  <Text style={styles.body}>{capability.summary}</Text>
                  {capability.coreFeatures.length ? <><Text style={styles.label}>Core features</Text><BulletList values={capability.coreFeatures} /></> : null}
                  {capability.defenceApplications.length ? <><Text style={styles.label}>Defence applications</Text><BulletList values={capability.defenceApplications} /></> : null}
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.eyebrow}>Analyst assessments</Text>
              <Text style={styles.sectionTitle}>Mission relevance</Text>
              {organization.capabilities.flatMap((capability) => capability.missionMatches).map((match) => (
                <View key={match.id} style={styles.derivedCard} wrap={false}>
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>{match.missionArea.name}</Text>
                  <Text style={{ marginTop: 4 }}>{match.alignmentSummary}</Text>
                  <Text style={{ marginTop: 4, fontSize: 7.5 }}>{assessmentConfidenceLabel(match.confidence)} assessment confidence</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.rail}>
            <View style={styles.paleCard}>
              <Text style={styles.eyebrow}>Profile at a glance</Text>
              <ProfileRow label="Headquarters" value={organization.primaryLocation?.name} />
              <ProfileRow label="Location accuracy" value={organization.primaryLocation ? locationAccuracyLabel(organization.primaryLocation.geographicConfidence) : null} />
              <ProfileRow label="Organization type" value={organization.entityKind.replaceAll("_", " ")} />
              <ProfileRow label="Categories" value={organization.categories.map((item) => item.replaceAll("_", " ")).join(", ")} />
              <ProfileRow label="Company stage" value={organization.companyStage} />
              <ProfileRow label="Employee range" value={organization.employeeRange} />
              <ProfileRow label="Evidence strength" value={evidenceStrengthLabel(organization.sourceConfidence)} />
            </View>
            {organization.websiteUrl ? <Link src={organization.websiteUrl} style={styles.sourceLink}>Official website</Link> : null}
            <Text style={styles.caveat}>Unknown fields are intentionally omitted. Mission and demand relevance are shown as analyst assessments, separate from verified profile information.</Text>
            <View style={{ marginTop: 12 }}>
              <Sources organization={organization} />
            </View>
          </View>
        </View>
        <Footer />
      </Page>
    </Document>
  );
}

function CapabilityPdf({ organization, capability }: { organization: AtlasOrganization; capability: AtlasCapability }) {
  return (
    <Document title={`${capability.name} public profile`} author="True North Map">
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.brand}>True North Map / Capability Profile</Text>
        <Text style={styles.title}>{capability.name}</Text>
        <Text style={styles.meta}>{organization.name}{capability.capabilityType ? ` · ${capability.capabilityType}` : ""}</Text>
        <Text style={styles.description}>{capability.summary}</Text>
        <View style={styles.divider} />
        <View style={styles.grid}>
          <View style={styles.main}>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Capability profile</Text>
              {capability.coreFeatures.length ? <><Text style={styles.label}>Core features</Text><BulletList values={capability.coreFeatures} /></> : null}
              {capability.defenceApplications.length ? <><Text style={styles.label}>Defence applications</Text><BulletList values={capability.defenceApplications} /></> : null}
              {capability.novelty.length ? <><Text style={styles.label}>Novelty</Text><BulletList values={capability.novelty} /></> : null}
            </View>
            <View style={styles.section}>
              <Text style={styles.eyebrow}>Analyst assessments</Text>
              <Text style={styles.sectionTitle}>Mission relevance</Text>
              {capability.missionMatches.map((match) => (
                <View key={match.id} style={styles.derivedCard} wrap={false}>
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>{match.missionArea.name}</Text>
                  <Text style={{ marginTop: 4 }}>{match.alignmentSummary}</Text>
                  <Text style={{ marginTop: 4, fontSize: 7.5 }}>{assessmentConfidenceLabel(match.confidence)} assessment confidence</Text>
                </View>
              ))}
              {!capability.missionMatches.length ? <Text style={styles.body}>Mission relevance has not been assessed yet.</Text> : null}
            </View>
          </View>
          <View style={styles.rail}>
            <View style={styles.paleCard}>
              <Text style={styles.eyebrow}>Data quality</Text>
              <ProfileRow label="Organization" value={organization.name} />
              <ProfileRow label="Evidence strength" value={evidenceStrengthLabel(capability.sourceConfidence)} />
              <ProfileRow label="TRL" value={capability.technologyReadinessLevel} />
              <ProfileRow label="Maturity" value={capability.maturity} />
              <ProfileRow label="Commercial availability" value={capability.commercialAvailability} />
              <ProfileRow label="Technical domains" value={capability.technicalDomains.map((domain) => domain.name).join(", ")} />
            </View>
            <Text style={styles.caveat}>Public-source profile. Demand mappings, when present, are not eligibility, endorsement, or procurement notices.</Text>
            <View style={{ marginTop: 12 }}>
              <Sources organization={organization} capability={capability} />
            </View>
          </View>
        </View>
        <Footer />
      </Page>
    </Document>
  );
}

function ProfileRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === "") return null;
  return <View style={styles.profileRow}><Text style={styles.profileLabel}>{label}</Text><Text style={styles.profileValue}>{String(value)}</Text></View>;
}

export async function renderOrganizationDossierPdf(organization: AtlasOrganization) {
  return renderToBuffer(<OrganizationPdf organization={organization} />);
}

export async function renderCapabilityDossierPdf(organization: AtlasOrganization, capability: AtlasCapability) {
  return renderToBuffer(<CapabilityPdf organization={organization} capability={capability} />);
}

export interface LookbookEntry {
  organization: AtlasOrganization;
  capability?: AtlasCapability;
  note?: string | null;
}

function LookbookPdf({ title, subtitle, entries }: { title: string; subtitle: string; entries: LookbookEntry[] }) {
  return (
    <Document title={title} author="True North Map">
      {entries.map(({ organization, capability, note }, index) => {
        const selectedCapability = capability ?? organization.capabilities[0];
        return (
          <Page key={`${organization.id}-${capability?.id ?? "organization"}-${index}`} size="LETTER" style={styles.page}>
            <Text style={styles.brand}>True North Map / Public Lookbook</Text>
            <Text style={styles.meta}>{title} · {index + 1} of {entries.length}</Text>
            <Text style={styles.title}>{capability?.name ?? organization.name}</Text>
            {capability ? <Text style={styles.meta}>{organization.name} · {capability.capabilityType ?? "Verified capability"}</Text> : null}
            <Text style={styles.description}>{capability?.summary ?? organization.description}</Text>
            {note ? <View style={styles.derivedCard}><Text style={{ fontFamily: "Helvetica-Bold" }}>Collection note</Text><Text style={{ marginTop: 4 }}>{note}</Text></View> : null}
            <View style={styles.divider} />
            <View style={styles.grid}>
              <View style={styles.main}>
                {selectedCapability ? (
                  <View style={styles.card}>
                    <Text style={styles.sectionTitle}>{selectedCapability.name}</Text>
                    {selectedCapability.coreFeatures.length ? <><Text style={styles.label}>Core features</Text><BulletList values={selectedCapability.coreFeatures} /></> : null}
                    {selectedCapability.defenceApplications.length ? <><Text style={styles.label}>Defence applications</Text><BulletList values={selectedCapability.defenceApplications} /></> : null}
                  </View>
                ) : null}
                <View style={styles.section}>
                  <Text style={styles.eyebrow}>Analyst assessments</Text>
                  <Text style={styles.sectionTitle}>Mission relevance</Text>
                  {(selectedCapability?.missionMatches ?? []).map((match) => (
                    <View key={match.id} style={styles.derivedCard} wrap={false}>
                      <Text style={{ fontFamily: "Helvetica-Bold" }}>{match.missionArea.name}</Text>
                      <Text style={{ marginTop: 4 }}>{match.alignmentSummary}</Text>
                    </View>
                  ))}
                  {!selectedCapability?.missionMatches.length ? <Text style={styles.body}>Mission relevance has not been assessed yet.</Text> : null}
                </View>
                <Sources organization={organization} capability={selectedCapability} />
              </View>
              <View style={styles.rail}>
                <View style={styles.paleCard}>
                  <Text style={styles.eyebrow}>{subtitle}</Text>
                  <ProfileRow label="Organization" value={organization.name} />
                  <ProfileRow label="Organization type" value={organization.entityKind.replaceAll("_", " ")} />
                  <ProfileRow label="Headquarters" value={organization.primaryLocation?.name} />
                  <ProfileRow label="Evidence strength" value={evidenceStrengthLabel(selectedCapability?.sourceConfidence ?? organization.sourceConfidence)} />
                  <ProfileRow label="Location accuracy" value={organization.primaryLocation ? locationAccuracyLabel(organization.primaryLocation.geographicConfidence) : null} />
                </View>
                <Text style={styles.caveat}>Public-source profile. Unknown fields are omitted; analyst assessments are labelled.</Text>
              </View>
            </View>
            <Footer />
          </Page>
        );
      })}
    </Document>
  );
}

export async function renderCollectionLookbookPdf(title: string, entries: LookbookEntry[]) {
  return renderToBuffer(<LookbookPdf title={title} subtitle="Private saved collection" entries={entries} />);
}

export async function renderRegionReportPdf(title: string, entries: LookbookEntry[]) {
  return renderToBuffer(<LookbookPdf title={`${title} Ecosystem Report`} subtitle="Regional public atlas" entries={entries} />);
}
