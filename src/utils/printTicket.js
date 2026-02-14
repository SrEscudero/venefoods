export const printOrderTicket = (order) => {
  // 1. Configuración de diseño (CSS para impresión térmica)
  const printWindow = window.open('', 'PRINT', 'height=600,width=400');

  if (!printWindow) {
    alert("Por favor permite las ventanas emergentes para imprimir el ticket.");
    return;
  }

  const styles = `
    <style>
      @page { size: 58mm auto; margin: 0; }
      body {
        font-family: 'Courier New', monospace;
        width: 58mm;
        margin: 0;
        padding: 5px;
        font-size: 12px;
        color: #000;
        background: #fff;
      }
      .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
      .logo { font-size: 16px; font-weight: bold; display: block; margin-bottom: 2px; }
      .meta { font-size: 10px; margin-bottom: 5px; }
      .divider { border-top: 1px dashed #000; margin: 5px 0; }
      .item-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
      .item-name { font-weight: bold; }
      .item-sub { font-size: 10px; color: #333; margin-left: 10px; }
      .totals { text-align: right; margin-top: 10px; font-size: 14px; font-weight: bold; border-top: 1px solid #000; pt-2; }
      .footer { text-align: center; margin-top: 15px; font-size: 10px; }
      .big-status { text-align: center; font-size: 14px; font-weight: bold; border: 1px solid #000; padding: 2px; margin: 5px 0; }
    </style>
  `;

  // 2. Construir el contenido HTML
  const itemsHtml = order.items.map(item => `
    <div class="item-box">
      <div class="item-row">
        <span>${item.quantity}x <span class="item-name">${item.name}</span></span>
        <span>R$ ${(item.price * item.quantity).toFixed(2)}</span>
      </div>
    </div>
  `).join('');

  const content = `
    <html>
      <head><title>Ticket #${order.id}</title>${styles}</head>
      <body>
        <div class="header">
          <span class="logo">🇻🇪 VENEFOODS</span>
          <span class="meta">Passo Fundo, RS</span>
          <span class="meta">Tel: +55 54 99329-4396</span>
        </div>

        <div class="meta">
          <strong>Pedido:</strong> #${order.id}<br/>
          <strong>Fecha:</strong> ${new Date(order.created_at).toLocaleString('pt-BR')}<br/>
          <strong>Cliente:</strong> ${order.customer_name}<br/>
          <strong>Tel:</strong> ${order.customer_phone || 'N/A'}
        </div>

        ${order.origin === 'delivery' ? `
        <div class="divider"></div>
        <div style="font-weight:bold;">📍 ENVÍO:</div>
        <div style="font-size:11px;">${order.address || 'Sin dirección'}</div>
        ` : ''}

        <div class="divider"></div>
        
        <div class="items-container">
          ${itemsHtml}
        </div>

        <div class="divider"></div>

        <div class="totals">
          TOTAL: R$ ${Number(order.total).toFixed(2)}
        </div>
        
        <div style="text-align:right; font-size:10px; margin-top:2px;">
          Método: ${order.payment_method.toUpperCase()}
        </div>

        <div class="footer">
          <div class="big-status">${order.status.toUpperCase()}</div>
          <p>¡Gracias por tu compra!<br/>www.venefoods.com</p>
        </div>
      </body>
    </html>
  `;

  // 3. Escribir y mandar a imprimir
  printWindow.document.write(content);
  printWindow.document.close();
  printWindow.focus();
  
  // Pequeño delay para asegurar que los estilos carguen
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
};