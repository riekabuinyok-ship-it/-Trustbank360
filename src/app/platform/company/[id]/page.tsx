import CompanyDetailClient from "./company-detail-client"

export default async function AdminCompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CompanyDetailClient id={id} />
}
