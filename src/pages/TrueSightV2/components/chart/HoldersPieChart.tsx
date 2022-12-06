import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'

const data01 = [
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 400 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 300 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 300 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 200 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 278 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 189 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 189 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 189 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 189 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 189 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 189 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 200 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 189 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 189 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 189 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 189 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 189 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 189 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 189 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 189 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 189 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 189 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 100 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 189 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 189 },
]

const COLORS = ['#00a2f7', '#31CB9E', '#FFBB28', '#F3841E', '#FF537B', '#27AE60', '#78d5ff', '#8088E5']

const CustomLabel = ({ x, y, cx, cy, name }: any) => {
  let customY = y
  if (Math.abs(cx - x) < 30) {
    customY = cy - y > 0 ? y - 8 : y + 8
  }
  return (
    <text x={x} y={customY} textAnchor={x > cx ? 'start' : 'end'} fill="#31CB9E" fontSize={12}>
      {name}
    </text>
  )
}

export default function HoldersPieChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart width={400} height={400}>
        <Pie dataKey="value" label={CustomLabel} nameKey="name" data={data01} innerRadius={60} outerRadius={120}>
          {data01.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length] + 'e0'} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  )
}
