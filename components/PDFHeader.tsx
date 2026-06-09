import Image from 'next/image'
import { format } from 'date-fns'
import { Ticket } from '@/types/types'
import './PDFHeader.css'

interface PDFHeaderProps {
  ticket: Ticket
}

export default function PDFHeader({ ticket }: PDFHeaderProps) {
  return (
    <div className="pdf-header">
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '24px', 
        borderBottom: '2px solid #374151', 
        paddingBottom: '16px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Image 
            src="/logo.jpeg" 
            alt="Logo" 
            width={60} 
            height={60} 
            style={{ borderRadius: '8px' }}
          />
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', margin: '0 0 4px 0' }}>
              Ticket Report
            </h1>
            <p style={{ color: '#999', fontSize: '12px', margin: 0 }}>
              Generated on {format(new Date(), 'PPP p')}
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div>
          <p style={{ color: '#999', fontSize: '12px', margin: 0 }}>Ticket Number</p>
          <p style={{ color: '#fff', fontWeight: '600', margin: '8px 0 0 0' }}>#{ticket.number}</p>
        </div>
        <div>
          <p style={{ color: '#999', fontSize: '12px', margin: 0 }}>Status</p>
          <p style={{ color: '#fff', fontWeight: '600', margin: '8px 0 0 0' }}>{ticket.status}</p>
        </div>
        <div>
          <p style={{ color: '#999', fontSize: '12px', margin: 0 }}>Priority</p>
          <p style={{ color: '#fff', fontWeight: '600', margin: '8px 0 0 0' }}>{ticket.priority}</p>
        </div>
        <div>
          <p style={{ color: '#999', fontSize: '12px', margin: 0 }}>Category</p>
          <p style={{ color: '#fff', fontWeight: '600', margin: '8px 0 0 0' }}>{ticket.category}</p>
        </div>
      </div>
    </div>
  )
}
